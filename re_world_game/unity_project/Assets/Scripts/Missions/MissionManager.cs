using System;
using UnityEngine;
using REWorld.AI;
using REWorld.Profile;
using REWorld.UI;

namespace REWorld.Missions
{
    public enum MissionType
    {
        VillageHub,
        BridgeMission,
        PowerMission
    }

    public class MissionManager : MonoBehaviour
    {
        public static MissionManager Instance { get; private set; }

        [Header("Current Mission State")]
        public MissionType activeMission = MissionType.VillageHub;
        public int currentAttemptNumber = 1;
        public float missionStartTime;

        [Header("References")]
        public NovaAIMentor novaMentor;
        public PlayerProfiler profiler;
        public HUDManager hudManager;

        public event Action<MissionType> OnMissionStarted;
        public event Action<MissionType, string> OnMissionFailed;
        public event Action<MissionType> OnMissionCompleted;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void Start()
        {
            StartMission(MissionType.VillageHub);
        }

        public void StartMission(MissionType mission)
        {
            activeMission = mission;
            currentAttemptNumber = 1;
            missionStartTime = Time.time;

            OnMissionStarted?.Invoke(mission);

            string title = GetMissionTitle(mission);
            string concept = GetMissionSTEMConcept(mission);
            if (hudManager != null)
            {
                hudManager.UpdateMissionInfo(title, concept);
            }

            if (novaMentor != null)
            {
                novaMentor.DisplayGreeting(mission);
            }
        }

        public void RecordFailure(string failureReason, string userAttemptJson)
        {
            currentAttemptNumber++;
            float duration = Time.time - missionStartTime;

            if (profiler != null)
            {
                profiler.RecordAttempt(activeMission.ToString(), false, failureReason, duration);
            }

            OnMissionFailed?.Invoke(activeMission, failureReason);

            if (novaMentor != null)
            {
                novaMentor.RequestSocraticHint(activeMission.ToString(), failureReason, userAttemptJson);
            }
        }

        public void RecordSuccess()
        {
            float duration = Time.time - missionStartTime;

            if (profiler != null)
            {
                profiler.RecordAttempt(activeMission.ToString(), true, "Success", duration);
                profiler.SaveProfile();
            }

            OnMissionCompleted?.Invoke(activeMission);

            if (hudManager != null)
            {
                hudManager.ShowMissionCompleteSummary(activeMission, duration, currentAttemptNumber, profiler);
            }
        }

        public string GetMissionTitle(MissionType mission)
        {
            switch (mission)
            {
                case MissionType.VillageHub: return "Village Hub: Rebuild Core";
                case MissionType.BridgeMission: return "Mission 1: Bridge Builder (Discovery)";
                case MissionType.PowerMission: return "Mission 2: Restore Power Grid (Energy)";
                default: return "RE:WORLD";
            }
        }

        public string GetMissionSTEMConcept(MissionType mission)
        {
            switch (mission)
            {
                case MissionType.VillageHub: return "STEM Concept: Structural Integrity & Community Energy Balance";
                case MissionType.BridgeMission: return "STEM Concept: Trusses, Tension vs. Compression, Equilibrium";
                case MissionType.PowerMission: return "STEM Concept: Closed Circuits, Voltage Potential, Energy Flow";
                default: return "STEM Engineering";
            }
        }
    }
}
