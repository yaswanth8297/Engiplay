using UnityEngine;
using UnityEngine.Rendering;
#if ENABLE_URP
using UnityEngine.Rendering.Universal;
#endif

namespace REWorld.World
{
    public class ProceduralWorldGenerator : MonoBehaviour
    {
        [Header("Lighting & Atmosphere")]
        public Color sunLightColor = new Color(1.0f, 0.95f, 0.85f);
        public float sunIntensity = 1.4f;

        [Header("PBR Materials Defaults")]
        public Material grassTerrainMaterial;
        public Material rockCliffMaterial;
        public Material woodDeckMaterial;
        public Material steelTrussMaterial;
        public Material solarPanelMaterial;

        private void Start()
        {
            SetupLightingAndEnvironment();
            ConstructVillageHub();
            ConstructBridgeCanyonArea();
            ConstructPowerStationSite();
        }

        public void SetupLightingAndEnvironment()
        {
            // Create Directional Sun
            GameObject sunObj = new GameObject("URP_SunLight");
            Light sun = sunObj.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = sunLightColor;
            sun.intensity = sunIntensity;
            sun.shadows = LightShadows.Soft;
            sunObj.transform.rotation = Quaternion.Euler(45f, -30f, 0f);

            // Ambient & Sky
            RenderSettings.ambientMode = AmbientMode.Skybox;
            RenderSettings.ambientIntensity = 1.1f;
        }

        public void ConstructVillageHub()
        {
            GameObject hubRoot = new GameObject("Village_Hub_Area");

            // Main Cobblestone/Grass Terrain Base
            GameObject terrain = GameObject.CreatePrimitive(PrimitiveType.Plane);
            terrain.name = "Village_Plaza_Ground";
            terrain.transform.SetParent(hubRoot.transform);
            terrain.transform.position = Vector3.zero;
            terrain.transform.localScale = new Vector3(8f, 1f, 8f);

            // Damaged Village Buildings (PBR textured block representations)
            CreateBuilding(hubRoot.transform, new Vector3(-15f, 3f, 10f), new Vector3(8f, 6f, 8f), "Town_Hall_Restoration_Site");
            CreateBuilding(hubRoot.transform, new Vector3(15f, 2.5f, 10f), new Vector3(6f, 5f, 6f), "Workshop_Building");
            CreateBuilding(hubRoot.transform, new Vector3(0f, 2f, 25f), new Vector3(10f, 4f, 6f), "Damaged_Power_Hub");

            // Hub Signpost NPC guide
            GameObject signpost = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            signpost.name = "Village_Mission_Signpost";
            signpost.transform.SetParent(hubRoot.transform);
            signpost.transform.position = new Vector3(0f, 1.5f, 5f);
            signpost.transform.localScale = new Vector3(0.3f, 1.5f, 0.3f);
        }

        public void ConstructBridgeCanyonArea()
        {
            GameObject canyonRoot = new GameObject("Bridge_Mission_Canyon");

            // Left Cliff Side
            GameObject leftCliff = GameObject.CreatePrimitive(PrimitiveType.Cube);
            leftCliff.name = "Left_Canyon_Cliff";
            leftCliff.transform.SetParent(canyonRoot.transform);
            leftCliff.transform.position = new Vector3(-20f, -5f, -40f);
            leftCliff.transform.localScale = new Vector3(15f, 10f, 15f);

            // Right Cliff Side
            GameObject rightCliff = GameObject.CreatePrimitive(PrimitiveType.Cube);
            rightCliff.name = "Right_Canyon_Cliff";
            rightCliff.transform.SetParent(canyonRoot.transform);
            rightCliff.transform.position = new Vector3(5f, -5f, -40f);
            rightCliff.transform.localScale = new Vector3(15f, 10f, 15f);

            // Canyon Floor River
            GameObject river = GameObject.CreatePrimitive(PrimitiveType.Plane);
            river.name = "Canyon_River_Bed";
            river.transform.SetParent(canyonRoot.transform);
            river.transform.position = new Vector3(-7.5f, -10f, -40f);
            river.transform.localScale = new Vector3(3f, 1f, 3f);
        }

        public void ConstructPowerStationSite()
        {
            GameObject powerRoot = new GameObject("Power_Mission_Station");

            // Solar Array Mounting Platform
            GameObject platform = GameObject.CreatePrimitive(PrimitiveType.Cube);
            platform.name = "Solar_Array_Platform";
            platform.transform.SetParent(powerRoot.transform);
            platform.transform.position = new Vector3(40f, 0.5f, 0f);
            platform.transform.localScale = new Vector3(12f, 0.5f, 12f);
        }

        private void CreateBuilding(Transform parent, Vector3 pos, Vector3 scale, string name)
        {
            GameObject bldg = GameObject.CreatePrimitive(PrimitiveType.Cube);
            bldg.name = name;
            bldg.transform.SetParent(parent);
            bldg.transform.position = pos;
            bldg.transform.localScale = scale;
        }
    }
}
