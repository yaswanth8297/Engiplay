using System;
using UnityEngine;
using UnityEngine.UI;
using REWorld.Missions;
using REWorld.Profile;

namespace REWorld.UI
{
    public class HUDManager : MonoBehaviour
    {
        [Header("Minimal HUD Components")]
        public Text missionTitleText;
        public Text stemConceptCalloutText;

        [Header("NOVA Socratic Dialogue Panel")]
        public GameObject novaPanel;
        public Text novaSpeakerTitleText;
        public Text novaDialogueBodyText;

        [Header("End-of-Mission Summary Panel")]
        public GameObject summaryPanel;
        public Text summaryMissionTitleText;
        public Text summaryTimeText;
        public Text summaryAttemptsText;
        public Text summaryDnaScoreText;
        public Text summaryArchetypeText;

        private void Start()
        {
            if (summaryPanel != null) summaryPanel.SetActive(false);
            if (novaPanel != null) novaPanel.SetActive(true);
        }

        public void UpdateMissionInfo(string title, string concept)
        {
            if (missionTitleText != null) missionTitleText.text = title;
            if (stemConceptCalloutText != null) stemConceptCalloutText.text = concept;
        }

        public void DisplayNovaDialogue(string speakerTitle, string dialogueMessage)
        {
            if (novaPanel != null) novaPanel.SetActive(true);
            if (novaSpeakerTitleText != null) novaSpeakerTitleText.text = speakerTitle;
            if (novaDialogueBodyText != null) novaDialogueBodyText.text = dialogueMessage;
        }

        public void ShowMissionCompleteSummary(MissionType mission, float duration, int totalAttempts, PlayerProfiler profiler)
        {
            if (summaryPanel != null)
            {
                summaryPanel.SetActive(true);

                if (summaryMissionTitleText != null)
                {
                    summaryMissionTitleText.text = $"MISSION ACCOMPLISHED!\n{mission}";
                }

                if (summaryTimeText != null)
                {
                    int mins = (int)(duration / 60);
                    int secs = (int)(duration % 60);
                    summaryTimeText.text = $"Completion Time: {mins:D2}:{secs:D2}";
                }

                if (summaryAttemptsText != null)
                {
                    summaryAttemptsText.text = $"Total Build Iterations: {totalAttempts}";
                }

                if (profiler != null && profiler.profile != null)
                {
                    var dna = profiler.profile.dna;
                    if (summaryDnaScoreText != null)
                    {
                        summaryDnaScoreText.text = $"Persistence: {dna.persistenceScore:F0}% | Structural: {dna.structuralIntuitionScore:F0}% | Circuit Safety: {dna.electricalSafetyScore:F0}%";
                    }

                    if (summaryArchetypeText != null)
                    {
                        summaryArchetypeText.text = $"ENGINEER DNA ARCHETYPE: {dna.archetype.ToUpper()}";
                    }
                }
            }
        }

        public void OnClickCloseSummary()
        {
            if (summaryPanel != null) summaryPanel.SetActive(false);
        }
    }
}
