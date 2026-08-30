using System;
using System.Collections.Generic;
using UnityEngine;

namespace REWorld.Missions
{
    public enum ComponentType
    {
        SolarPanel,
        BatteryBank,
        Switch,
        Wire,
        LightBulb
    }

    [Serializable]
    public class CircuitComponent
    {
        public int id;
        public ComponentType type;
        public Vector3 position;
        public int inputConnectionId = -1;
        public int outputConnectionId = -1;
        public bool isSwitchClosed = false;
        public float voltageRating = 12.0f;
    }

    public class PowerGridBuilder : MonoBehaviour
    {
        [Header("Power Grid Elements")]
        public List<CircuitComponent> components = new List<CircuitComponent>();
        public bool isSystemPowered = false;
        public Light villageMasterLight;

        private void Start()
        {
            InitializeDefaultPowerStation();
        }

        public void InitializeDefaultPowerStation()
        {
            components.Clear();

            // Solar Panel (Source)
            components.Add(new CircuitComponent
            {
                id = 0,
                type = ComponentType.SolarPanel,
                position = new Vector3(-6f, 0f, 0f),
                voltageRating = 12f
            });

            // Battery Bank
            components.Add(new CircuitComponent
            {
                id = 1,
                type = ComponentType.BatteryBank,
                position = new Vector3(-3f, 0f, 0f),
                voltageRating = 12f
            });

            // Switch
            components.Add(new CircuitComponent
            {
                id = 2,
                type = ComponentType.Switch,
                position = new Vector3(0f, 0f, 0f),
                isSwitchClosed = false
            });

            // Light Bulb (Village Load)
            components.Add(new CircuitComponent
            {
                id = 3,
                type = ComponentType.LightBulb,
                position = new Vector3(6f, 0f, 0f),
                voltageRating = 12f
            });
        }

        public void ConnectComponents(int sourceId, int targetId)
        {
            if (sourceId >= 0 && sourceId < components.Count && targetId >= 0 && targetId < components.Count)
            {
                components[sourceId].outputConnectionId = targetId;
                components[targetId].inputConnectionId = sourceId;
            }
        }

        public void ToggleSwitch(int switchId)
        {
            if (switchId >= 0 && switchId < components.Count && components[switchId].type == ComponentType.Switch)
            {
                components[switchId].isSwitchClosed = !components[switchId].isSwitchClosed;
                TestCircuitPowerFlow();
            }
        }

        public void TestCircuitPowerFlow()
        {
            bool success = ValidateCircuit(out string failureReason);

            if (success)
            {
                isSystemPowered = true;
                if (villageMasterLight != null)
                {
                    villageMasterLight.enabled = true;
                    villageMasterLight.intensity = 3.5f;
                    villageMasterLight.color = new Color(1.0f, 0.9f, 0.7f); // Warm tungsten light
                }

                if (MissionManager.Instance != null)
                {
                    MissionManager.Instance.RecordSuccess();
                }
            }
            else
            {
                isSystemPowered = false;
                if (villageMasterLight != null)
                {
                    villageMasterLight.enabled = false;
                }

                string attemptJson = $"{{\"components_count\": {components.Count}, \"reason\": \"{failureReason}\"}}";
                if (MissionManager.Instance != null)
                {
                    MissionManager.Instance.RecordFailure(failureReason, attemptJson);
                }
            }
        }

        public bool ValidateCircuit(out string failureReason)
        {
            failureReason = "";

            // Find Solar Source
            CircuitComponent source = components.Find(c => c.type == ComponentType.SolarPanel);
            if (source == null || source.outputConnectionId == -1)
            {
                failureReason = "open_circuit_no_source_wire";
                return false;
            }

            // Find Switch
            CircuitComponent switchComp = components.Find(c => c.type == ComponentType.Switch);
            if (switchComp != null && !switchComp.isSwitchClosed)
            {
                failureReason = "open_circuit_switch_off";
                return false;
            }

            // Trace path from Source -> Battery -> Switch -> Light -> Ground (Source)
            HashSet<int> visited = new HashSet<int>();
            int currId = source.id;
            bool reachedBulb = false;

            while (currId != -1 && !visited.Contains(currId))
            {
                visited.Add(currId);
                CircuitComponent curr = components.Find(c => c.id == currId);
                if (curr == null) break;

                if (curr.type == ComponentType.LightBulb)
                {
                    reachedBulb = true;
                }

                // Check for direct short circuit bypass
                if (reachedBulb == false && curr.outputConnectionId == source.id)
                {
                    failureReason = "short_circuit_direct_loop";
                    return false;
                }

                if (curr.outputConnectionId == source.id && reachedBulb)
                {
                    // Full valid closed loop through load!
                    return true;
                }

                currId = curr.outputConnectionId;
            }

            if (!reachedBulb)
            {
                failureReason = "open_circuit_wire_disconnected";
                return false;
            }

            failureReason = "open_circuit_unclosed_ground_return";
            return false;
        }
    }
}
