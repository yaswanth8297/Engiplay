using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using REWorld.UI;
using REWorld.Missions;

namespace REWorld.AI
{
    [Serializable]
    public class HintPayload
    {
        public string mission;
        public string failure_reason;
        public string user_attempt_raw;
    }

    [Serializable]
    public class HintResponseData
    {
        public string hint;
        public string socratic_focus;
        public string recommended_action;
    }

    public class NovaAIMentor : MonoBehaviour
    {
        [Header("FastAPI AI Backend Endpoint")]
        public string apiBaseUrl = "http://localhost:8000";

        [Header("UI Component")]
        public HUDManager hudManager;

        public void DisplayGreeting(MissionType mission)
        {
            string greeting = "";
            switch (mission)
            {
                case MissionType.VillageHub:
                    greeting = "Welcome to the Village! I'm NOVA, your STEM engineering mentor. Explore the area and head over to the Bridge or Power Station to start rebuilding!";
                    break;
                case MissionType.BridgeMission:
                    greeting = "Greetings Engineer! We need to connect this canyon. Build a strong bridge deck using wood, steel, or cables. Remember to test your structure!";
                    break;
                case MissionType.PowerMission:
                    greeting = "Welcome to the Power Grid! Connect the Solar Panel and Battery to light up the Village. Remember: electricity flows in closed loops!";
                    break;
            }

            if (hudManager != null)
            {
                hudManager.DisplayNovaDialogue("NOVA (AI Mentor)", greeting);
            }
        }

        public void RequestSocraticHint(string missionName, string failureReason, string userAttemptJson)
        {
            StartCoroutine(PostSocraticHintRequest(missionName, failureReason, userAttemptJson));
        }

        private IEnumerator PostSocraticHintRequest(string missionName, string failureReason, string userAttemptJson)
        {
            if (hudManager != null)
            {
                hudManager.DisplayNovaDialogue("NOVA", "Analyzing structural stress patterns...");
            }

            string jsonString = $"{{\"mission\":\"{missionName}\",\"failure_reason\":\"{failureReason}\",\"user_attempt\":{{}},\"history\":[]}}";
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonString);

            using (UnityWebRequest request = new UnityWebRequest($"{apiBaseUrl}/api/nova/hint", "POST"))
            {
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");

                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    string jsonResponse = request.downloadHandler.text;
                    HintResponseData data = JsonUtility.FromJson<HintResponseData>(jsonResponse);

                    if (data != null && !string.IsNullOrEmpty(data.hint))
                    {
                        if (hudManager != null)
                        {
                            hudManager.DisplayNovaDialogue("NOVA (Socratic Mentor)", data.hint);
                        }
                    }
                }
                else
                {
                    // Standalone Fallback
                    string offlineHint = GetOfflineFallbackHint(missionName, failureReason);
                    if (hudManager != null)
                    {
                        hudManager.DisplayNovaDialogue("NOVA (Mentor)", offlineHint);
                    }
                }
            }
        }

        private string GetOfflineFallbackHint(string mission, string reason)
        {
            if (mission.Contains("Bridge"))
            {
                if (reason.Contains("snap") || reason.Contains("break"))
                {
                    return "Which beam experienced the highest force during the load test? Notice how triangles distribute force compared to squares!";
                }
                return "Observe the replay carefully! What happens to the center of the span when weight moves across?";
            }
            else
            {
                if (reason.Contains("off") || reason.Contains("open"))
                {
                    return "Is there an unbroken loop returning back to the battery? Trace the current path from (+) to (-)!";
                }
                return "Double check your switch position and wire terminals!";
            }
        }
    }
}
