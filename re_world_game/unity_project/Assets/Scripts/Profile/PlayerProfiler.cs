using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace REWorld.Profile
{
    [Serializable]
    public class MissionAttemptRecord
    {
        public string missionName;
        public bool isSuccess;
        public string failureReason;
        public float durationSeconds;
        public string timestamp;
    }

    [Serializable]
    public class EngineerDNA
    {
        public int totalAttempts = 0;
        public int totalSuccesses = 0;
        public float persistenceScore = 50.0f;          // 0 - 100
        public float structuralIntuitionScore = 50.0f;  // 0 - 100
        public float electricalSafetyScore = 50.0f;     // 0 - 100
        public float materialEfficiencyScore = 50.0f;   // 0 - 100
        public string archetype = "Novice Apprentice";
    }

    [Serializable]
    public class PlayerProfileData
    {
        public string playerId = "ENG-7890";
        public List<MissionAttemptRecord> attempts = new List<MissionAttemptRecord>();
        public EngineerDNA dna = new EngineerDNA();
    }

    public class PlayerProfiler : MonoBehaviour
    {
        public PlayerProfileData profile = new PlayerProfileData();
        private string saveFilePath;

        private void Awake()
        {
            saveFilePath = Path.Combine(Application.persistentDataPath, "reworld_profile.json");
            LoadProfile();
        }

        public void RecordAttempt(string mission, bool success, string reason, float duration)
        {
            MissionAttemptRecord record = new MissionAttemptRecord
            {
                missionName = mission,
                isSuccess = success,
                failureReason = reason,
                durationSeconds = duration,
                timestamp = DateTime.UtcNow.ToString("o")
            };

            profile.attempts.Add(record);
            RecalculateEngineerDNA();
        }

        public void RecalculateEngineerDNA()
        {
            profile.dna.totalAttempts = profile.attempts.Count;
            int successes = 0;
            int bridgeRetries = 0;
            int powerRetries = 0;

            foreach (var att in profile.attempts)
            {
                if (att.isSuccess) successes++;
                if (att.missionName.Contains("Bridge") && !att.isSuccess) bridgeRetries++;
                if (att.missionName.Contains("Power") && !att.isSuccess) powerRetries++;
            }

            profile.dna.totalSuccesses = successes;

            // Compute scores
            profile.dna.persistenceScore = Mathf.Clamp(50.0f + (profile.dna.totalAttempts * 8.0f), 0f, 100f);
            profile.dna.structuralIntuitionScore = Mathf.Clamp(75.0f - (bridgeRetries * 10.0f) + (successes * 15.0f), 0f, 100f);
            profile.dna.electricalSafetyScore = Mathf.Clamp(75.0f - (powerRetries * 10.0f) + (successes * 15.0f), 0f, 100f);
            profile.dna.materialEfficiencyScore = Mathf.Clamp(60.0f + (successes * 12.0f), 0f, 100f);

            // Determine Archetype
            if (profile.dna.structuralIntuitionScore > 80 && profile.dna.electricalSafetyScore > 80)
            {
                profile.dna.archetype = "Master Systems Architect";
            }
            else if (profile.dna.persistenceScore > 75)
            {
                profile.dna.archetype = "Relentless Problem Solver";
            }
            else if (profile.dna.structuralIntuitionScore > 70)
            {
                profile.dna.archetype = "Structural Innovator";
            }
            else
            {
                profile.dna.archetype = "Adaptive Engineer";
            }
        }

        public void SaveProfile()
        {
            try
            {
                string json = JsonUtility.ToJson(profile, true);
                File.WriteAllText(saveFilePath, json);
                Debug.Log($"Player profile saved successfully to: {saveFilePath}");
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to save player profile: {ex.Message}");
            }
        }

        public void LoadProfile()
        {
            try
            {
                if (File.Exists(saveFilePath))
                {
                    string json = File.ReadAllText(saveFilePath);
                    profile = JsonUtility.FromJson<PlayerProfileData>(json);
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"Could not load existing profile, initializing fresh profile: {ex.Message}");
                profile = new PlayerProfileData();
            }
        }
    }
}
