using System;
using System.Collections.Generic;
using UnityEngine;

namespace REWorld.Missions
{
    public enum BeamMaterial
    {
        Wood,   // Cost $10, Max Tension 100kN, Max Compression 80kN
        Steel,  // Cost $50, Max Tension 500kN, Max Compression 400kN
        Cable   // Cost $20, Max Tension 300kN, Max Compression 0kN (cannot hold compression)
    }

    [Serializable]
    public class BridgeNode
    {
        public int id;
        public Vector3 position;
        public bool isAnchor;
    }

    [Serializable]
    public class BridgeMember
    {
        public int nodeA;
        public int nodeB;
        public BeamMaterial material;
        public float currentLoadTension;
        public float currentLoadCompression;
        public bool isBroken;
    }

    public class BridgeBuilder : MonoBehaviour
    {
        [Header("Mission Configuration")]
        public float gapWidth = 15.0f;
        public float budgetLimit = 300.0f;
        public float truckWeight = 1500.0f; // 1.5 tons

        [Header("State")]
        public List<BridgeNode> nodes = new List<BridgeNode>();
        public List<BridgeMember> members = new List<BridgeMember>();
        public bool isTesting = false;
        public float currentSpent = 0.0f;

        [Header("Failure Tracking Camera")]
        public Transform failureCameraTarget;
        public Camera mainCamera;

        private void Start()
        {
            InitializeAnchorNodes();
        }

        public void InitializeAnchorNodes()
        {
            nodes.Clear();
            members.Clear();
            currentSpent = 0.0f;

            // Left Canyon Anchor Nodes
            nodes.Add(new BridgeNode { id = 0, position = new Vector3(- gapWidth / 2, 0, 0), isAnchor = true });
            nodes.Add(new BridgeNode { id = 1, position = new Vector3(- gapWidth / 2, -3f, 0), isAnchor = true });

            // Right Canyon Anchor Nodes
            nodes.Add(new BridgeNode { id = 2, position = new Vector3(gapWidth / 2, 0, 0), isAnchor = true });
            nodes.Add(new BridgeNode { id = 3, position = new Vector3(gapWidth / 2, -3f, 0), isAnchor = true });
        }

        public bool AddNode(Vector3 worldPos, out int newId)
        {
            newId = nodes.Count;
            nodes.Add(new BridgeNode { id = newId, position = worldPos, isAnchor = false });
            return true;
        }

        public bool AddMember(int nodeA, int nodeB, BeamMaterial material)
        {
            float cost = GetMaterialCost(material);
            if (currentSpent + cost > budgetLimit)
            {
                Debug.LogWarning("Bridge Builder: Budget limit exceeded!");
                return false;
            }

            members.Add(new BridgeMember
            {
                nodeA = nodeA,
                nodeB = nodeB,
                material = material,
                currentLoadTension = 0f,
                currentLoadCompression = 0f,
                isBroken = false
            });

            currentSpent += cost;
            return true;
        }

        public float GetMaterialCost(BeamMaterial mat)
        {
            switch (mat)
            {
                case BeamMaterial.Wood: return 10f;
                case BeamMaterial.Steel: return 50f;
                case BeamMaterial.Cable: return 20f;
                default: return 10f;
            }
        }

        public void StartLoadTest()
        {
            if (isTesting) return;
            isTesting = true;

            // Evaluate structural integrity using truss matrix forces
            bool structurallySound = AnalyzeBridgeTruss(out string failureReason, out int failedMemberIdx);

            if (!structurallySound)
            {
                TriggerFailureSequence(failureReason, failedMemberIdx);
            }
            else
            {
                TriggerSuccessSequence();
            }
        }

        private bool AnalyzeBridgeTruss(out string failureReason, out int failedMemberIdx)
        {
            failedMemberIdx = -1;
            failureReason = "";

            if (members.Count == 0)
            {
                failureReason = "center_span_snap_no_deck";
                return false;
            }

            // Check if deck connects left anchor to right anchor
            bool connectsAcross = CheckDeckConnectivity();
            if (!connectsAcross)
            {
                failureReason = "center_span_snap_disconnected";
                return false;
            }

            // Calculate internal tension and compression for each member
            for (int i = 0; i < members.Count; i++)
            {
                BridgeMember m = members[i];
                Vector3 pA = nodes[m.nodeA].position;
                Vector3 pB = nodes[m.nodeB].position;
                float len = Vector3.Distance(pA, pB);

                // Vertical load center penalty
                float distFromCenter = Mathf.Abs((pA.x + pB.x) / 2.0f);
                float centerFactor = 1.0f + (1.0f - (distFromCenter / (gapWidth / 2.0f))) * 2.0f;

                // Triangle support check
                bool hasTriangle = CheckNodeTriangle(m.nodeA) || CheckNodeTriangle(m.nodeB);
                float triangleMultiplier = hasTriangle ? 0.4f : 1.8f;

                float calculatedForce = (truckWeight * centerFactor * triangleMultiplier) / Mathf.Max(len, 1.0f);

                bool isTension = pA.y < 0 || pB.y < 0; // Simplified physics model for demo
                if (isTension)
                {
                    m.currentLoadTension = calculatedForce;
                    float maxT = GetMaxTension(m.material);
                    if (m.currentLoadTension > maxT)
                    {
                        failedMemberIdx = i;
                        failureReason = m.material == BeamMaterial.Cable ? "excessive_tension_cable_snap" : "center_span_snap_tension_break";
                        return false;
                    }
                }
                else
                {
                    m.currentLoadCompression = calculatedForce;
                    float maxC = GetMaxCompression(m.material);
                    if (m.currentLoadCompression > maxC)
                    {
                        failedMemberIdx = i;
                        failureReason = m.material == BeamMaterial.Cable ? "excessive_tension_cable_buckling" : "center_span_snap_compression_buckle";
                        return false;
                    }
                }
            }

            return true;
        }

        private bool CheckDeckConnectivity()
        {
            // Simple graph search from left anchor node 0 to right anchor node 2
            HashSet<int> visited = new HashSet<int>();
            Queue<int> queue = new Queue<int>();
            queue.Enqueue(0);
            visited.Add(0);

            while (queue.Count > 0)
            {
                int curr = queue.Dequeue();
                if (curr == 2) return true;

                foreach (var m in members)
                {
                    int neighbor = -1;
                    if (m.nodeA == curr) neighbor = m.nodeB;
                    else if (m.nodeB == curr) neighbor = m.nodeA;

                    if (neighbor != -1 && !visited.Contains(neighbor))
                    {
                        visited.Add(neighbor);
                        queue.Enqueue(neighbor);
                    }
                }
            }
            return false;
        }

        private bool CheckNodeTriangle(int nodeId)
        {
            // Verify if nodeId forms part of a 3-cycle in graph
            List<int> neighbors = new List<int>();
            foreach (var m in members)
            {
                if (m.nodeA == nodeId) neighbors.Add(m.nodeB);
                else if (m.nodeB == nodeId) neighbors.Add(m.nodeA);
            }

            for (int i = 0; i < neighbors.Count; i++)
            {
                for (int j = i + 1; j < neighbors.Count; j++)
                {
                    int u = neighbors[i];
                    int v = neighbors[j];
                    foreach (var m in members)
                    {
                        if ((m.nodeA == u && m.nodeB == v) || (m.nodeA == v && m.nodeB == u))
                            return true;
                    }
                }
            }
            return false;
        }

        private float GetMaxTension(BeamMaterial mat)
        {
            switch (mat)
            {
                case BeamMaterial.Wood: return 350f;
                case BeamMaterial.Steel: return 2000f;
                case BeamMaterial.Cable: return 1200f;
                default: return 350f;
            }
        }

        private float GetMaxCompression(BeamMaterial mat)
        {
            switch (mat)
            {
                case BeamMaterial.Wood: return 250f;
                case BeamMaterial.Steel: return 1600f;
                case BeamMaterial.Cable: return 0.1f; // Cables buckle instantly under compression
                default: return 250f;
            }
        }

        private void TriggerFailureSequence(string failureReason, int failedMemberIdx)
        {
            isTesting = false;
            if (failedMemberIdx >= 0 && failedMemberIdx < members.Count)
            {
                members[failedMemberIdx].isBroken = true;
            }

            string attemptJson = $"{{\"members_count\": {members.Count}, \"spent\": {currentSpent}, \"failed_index\": {failedMemberIdx}}}";

            if (MissionManager.Instance != null)
            {
                MissionManager.Instance.RecordFailure(failureReason, attemptJson);
            }
        }

        private void TriggerSuccessSequence()
        {
            isTesting = false;
            if (MissionManager.Instance != null)
            {
                MissionManager.Instance.RecordSuccess();
            }
        }
    }
}
