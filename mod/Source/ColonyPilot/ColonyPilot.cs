using UnityEngine;
using Verse;

namespace ColonyPilot
{
    public sealed class ColonyPilotSettings : ModSettings
    {
        public bool manageWorkPriorities = true;
        public bool manageResearch = true;
        public bool manageFarming = true;
        public bool manageShelter = true;
        public bool manageProduction = true;
        public bool manageTrading = true;
        public bool manageCombat = true;
        public bool manageStockpiles = true;
        public bool manageBaseDefense = true;
        public bool manageDiplomacy = true;
        public bool pauseOnHostileThreats;

        public override void ExposeData()
        {
            Scribe_Values.Look(ref manageWorkPriorities, "manageWorkPriorities", true);
            Scribe_Values.Look(ref manageResearch, "manageResearch", true);
            Scribe_Values.Look(ref manageFarming, "manageFarming", true);
            Scribe_Values.Look(ref manageShelter, "manageShelter", true);
            Scribe_Values.Look(ref manageProduction, "manageProduction", true);
            Scribe_Values.Look(ref manageTrading, "manageTrading", true);
            Scribe_Values.Look(ref manageCombat, "manageCombat", true);
            Scribe_Values.Look(ref manageStockpiles, "manageStockpiles", true);
            Scribe_Values.Look(ref manageBaseDefense, "manageBaseDefense", true);
            Scribe_Values.Look(ref manageDiplomacy, "manageDiplomacy", true);
            Scribe_Values.Look(ref pauseOnHostileThreats, "pauseOnHostileThreats", false);
        }
    }

    public sealed class ColonyPilotMod : Mod
    {
        public static ColonyPilotSettings Settings { get; private set; }

        public ColonyPilotMod(ModContentPack content) : base(content)
        {
            Settings = GetSettings<ColonyPilotSettings>();
        }

        public override string SettingsCategory()
        {
            return "ColonyPilot.SettingsCategory".Translate();
        }

        public override void DoSettingsWindowContents(Rect inRect)
        {
            var listing = new Listing_Standard();
            listing.Begin(inRect);
            listing.CheckboxLabeled(
                "ColonyPilot.ManageWorkPriorities".Translate(),
                ref Settings.manageWorkPriorities);
            listing.CheckboxLabeled(
                "ColonyPilot.ManageResearch".Translate(),
                ref Settings.manageResearch);
            listing.CheckboxLabeled(
                "ColonyPilot.ManageFarming".Translate(),
                ref Settings.manageFarming);
            listing.CheckboxLabeled(
                "ColonyPilot.ManageShelter".Translate(),
                ref Settings.manageShelter);
            listing.CheckboxLabeled(
                "ColonyPilot.ManageProduction".Translate(),
                ref Settings.manageProduction);
            listing.CheckboxLabeled(
                "ColonyPilot.ManageTrading".Translate(),
                ref Settings.manageTrading);
            listing.CheckboxLabeled(
                "ColonyPilot.ManageCombat".Translate(),
                ref Settings.manageCombat);
            listing.CheckboxLabeled(
                "ColonyPilot.ManageStockpiles".Translate(),
                ref Settings.manageStockpiles);
            listing.CheckboxLabeled(
                "ColonyPilot.ManageBaseDefense".Translate(),
                ref Settings.manageBaseDefense);
            listing.CheckboxLabeled(
                "ColonyPilot.ManageDiplomacy".Translate(),
                ref Settings.manageDiplomacy);
            listing.CheckboxLabeled(
                "ColonyPilot.PauseOnHostileThreats".Translate(),
                ref Settings.pauseOnHostileThreats);
            listing.Gap();
            listing.Label("ColonyPilot.SettingsHelp".Translate());
            listing.End();
        }
    }
}
