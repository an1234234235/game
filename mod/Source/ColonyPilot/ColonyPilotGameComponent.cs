using System;
using System.Collections.Generic;
using RimWorld;
using Verse;

namespace ColonyPilot
{
    public sealed class ColonyPilotGameComponent : GameComponent
    {
        private sealed class ColonyNeeds
        {
            public int ColonistCount;
            public float FoodPerColonist;
            public bool HasColonistNeedingTreatment;
            public bool HasConstructionWork;
        }

        private const int UpdateIntervalTicks = 2500;
        private const int ThreatCheckIntervalTicks = 60;
        private const int FoodObservationIntervalTicks = 15000;
        private const int ShelterBlueprintsPerUpdate = 4;
        private const int DefenseBlueprintsPerUpdate = 4;
        private const int MaxDefenseSandbags = 20;
        private const float GiftValueLimit = 500f;
        private const int GiftGoodwillTarget = 75;
        private const int MinimumGeneralStockpileCells = 16;
        private const float FoodReservePerColonist = 75f;
        private const float CriticalFoodReservePerColonist = 25f;
        private const float FoodReserveDays = 14f;
        private const int FarmCellLimit = 64;
        private const int MinimumFarmCells = 24;
        private const int SilverReserve = 500;
        private const int MedicineReserve = 5;
        private const int SurplusStockLimit = 200;
        private const int SurplusKeepCount = 100;
        private const string ColonyPilotFarmLabel = "Colony Pilot Farm";
        private const string ColonyPilotReserveFarmLabel = "Colony Pilot Farm 2";
        private const string ColonyPilotStockpileLabel = "Colony Pilot Stockpile";
        private const string ColonyPilotDefenseLabel = "Colony Pilot Defense";
        private int nextUpdateTick;
        private int nextThreatCheckTick;
        private int lastFoodSampleTick;
        private int lastFoodSampleColonistCount;
        private float lastFoodSampleNutrition;
        private float estimatedDailyFoodUsePerColonist;
        private bool threatMessageSent;
        private Dialog_Trade handledTradeDialog;
        private static bool missingSimpleMealRecipeLogged;
        private List<Map> shelterProjectMaps = new List<Map>();
        private List<IntVec3> shelterProjectCenters = new List<IntVec3>();
        private List<Pawn> autoDraftedPawns = new List<Pawn>();
        private bool shelterSiteWarningSent;

        public ColonyPilotGameComponent(Game game)
        {
        }

        public override void ExposeData()
        {
            base.ExposeData();
            Scribe_Collections.Look(ref shelterProjectMaps, "shelterProjectMaps", LookMode.Reference);
            Scribe_Collections.Look(ref shelterProjectCenters, "shelterProjectCenters", LookMode.Value);
            Scribe_Collections.Look(ref autoDraftedPawns, "autoDraftedPawns", LookMode.Reference);
            Scribe_Values.Look(ref lastFoodSampleTick, "lastFoodSampleTick", 0);
            Scribe_Values.Look(ref lastFoodSampleColonistCount, "lastFoodSampleColonistCount", 0);
            Scribe_Values.Look(ref lastFoodSampleNutrition, "lastFoodSampleNutrition", 0f);
            Scribe_Values.Look(ref estimatedDailyFoodUsePerColonist, "estimatedDailyFoodUsePerColonist", 0f);

            if (Scribe.mode == LoadSaveMode.PostLoadInit)
            {
                shelterProjectMaps = shelterProjectMaps ?? new List<Map>();
                shelterProjectCenters = shelterProjectCenters ?? new List<IntVec3>();
                autoDraftedPawns = autoDraftedPawns ?? new List<Pawn>();

                while (shelterProjectCenters.Count > shelterProjectMaps.Count)
                {
                    shelterProjectCenters.RemoveAt(shelterProjectCenters.Count - 1);
                }

                while (shelterProjectMaps.Count > shelterProjectCenters.Count)
                {
                    shelterProjectMaps.RemoveAt(shelterProjectMaps.Count - 1);
                }
            }
        }

        public override void GameComponentUpdate()
        {
            if (ColonyPilotMod.Settings != null &&
                (ColonyPilotMod.Settings.manageTrading || ColonyPilotMod.Settings.manageDiplomacy))
            {
                ManageTrading();
            }
            else
            {
                handledTradeDialog = null;
            }
        }

        public override void GameComponentTick()
        {
            int currentTick = Find.TickManager.TicksGame;
            if (currentTick >= nextThreatCheckTick)
            {
                nextThreatCheckTick = currentTick + ThreatCheckIntervalTicks;
                bool hasHostileThreat = HasHostileThreats();
                if (!hasHostileThreat)
                {
                    if (autoDraftedPawns.Count > 0)
                    {
                        ReleaseAutoDraftedPawns();
                    }

                    threatMessageSent = false;
                }
                else if (ColonyPilotMod.Settings != null &&
                    ColonyPilotMod.Settings.manageCombat)
                {
                    ManageCombat();
                    if (!threatMessageSent)
                    {
                        Messages.Message(
                            "ColonyPilot.CombatEngaged".Translate(),
                            null,
                            MessageTypeDefOf.ThreatBig,
                            false);
                        threatMessageSent = true;
                    }
                }
                else
                {
                    if (autoDraftedPawns.Count > 0)
                    {
                        ReleaseAutoDraftedPawns();
                    }

                    if (ColonyPilotMod.Settings != null &&
                        ColonyPilotMod.Settings.pauseOnHostileThreats &&
                        !Find.TickManager.Paused)
                    {
                        Find.TickManager.Pause();
                        if (!threatMessageSent)
                        {
                            Messages.Message(
                                "ColonyPilot.HostileThreatPaused".Translate(),
                                null,
                                MessageTypeDefOf.ThreatBig,
                                false);
                            threatMessageSent = true;
                        }
                    }
                }
            }

            if (currentTick < nextUpdateTick)
            {
                return;
            }

            nextUpdateTick = currentTick + UpdateIntervalTicks;
            if (ColonyPilotMod.Settings == null)
            {
                return;
            }

            UpdateFoodConsumptionEstimate(currentTick);

            if (ColonyPilotMod.Settings.manageResearch)
            {
                SelectResearchProject();
            }

            if (ColonyPilotMod.Settings.manageFarming)
            {
                ManageFarming();
            }

            if (ColonyPilotMod.Settings.manageShelter)
            {
                ManageShelter();
            }

            if (ColonyPilotMod.Settings.manageProduction)
            {
                ManageProduction();
            }

            if (ColonyPilotMod.Settings.manageStockpiles)
            {
                ManageStockpiles();
            }

            if (ColonyPilotMod.Settings.manageBaseDefense)
            {
                ManageBaseDefense();
            }

            if (ColonyPilotMod.Settings.manageWorkPriorities)
            {
                ColonyNeeds needs = AssessColonyNeeds();
                foreach (Map map in Find.Maps)
                {
                    foreach (Pawn pawn in map.mapPawns.FreeColonists)
                    {
                        BalanceWorkPriorities(pawn, needs);
                    }
                }
            }
        }

        private ColonyNeeds AssessColonyNeeds()
        {
            var needs = new ColonyNeeds();
            float foodNutrition = 0f;
            foreach (Map map in Find.Maps)
            {
                if (!map.IsPlayerHome)
                {
                    continue;
                }

                foodNutrition += map.resourceCounter.TotalHumanEdibleNutrition;
                foreach (Pawn pawn in map.mapPawns.FreeColonists)
                {
                    needs.ColonistCount++;
                    if (pawn.health != null &&
                        pawn.health.hediffSet != null &&
                        pawn.health.hediffSet.HasTendableHediff(false))
                    {
                        needs.HasColonistNeedingTreatment = true;
                    }
                }

                foreach (Thing thing in map.listerThings.AllThings)
                {
                    var blueprint = thing as Blueprint_Build;
                    if (blueprint != null && blueprint.Faction == Faction.OfPlayer)
                    {
                        needs.HasConstructionWork = true;
                        break;
                    }
                }
            }

            if (needs.ColonistCount > 0)
            {
                needs.FoodPerColonist = foodNutrition / needs.ColonistCount;
            }

            return needs;
        }

        private static void ManageProduction()
        {
            RecipeDef simpleMealRecipe = DefDatabase<RecipeDef>.GetNamedSilentFail("CookMealSimple");
            RecipeDef butcheringRecipe = DefDatabase<RecipeDef>.GetNamedSilentFail("ButcherCreature");
            if (simpleMealRecipe == null && butcheringRecipe == null)
            {
                if (!missingSimpleMealRecipeLogged)
                {
                    Log.Error("Colony Pilot could not find its meal or butchering recipes; automatic food production is disabled.");
                    missingSimpleMealRecipeLogged = true;
                }

                return;
            }

            foreach (Map map in Find.Maps)
            {
                if (!map.IsPlayerHome || map.mapPawns.FreeColonists.Count == 0)
                {
                    continue;
                }

                Building_WorkTable availableStove = null;
                Building_WorkTable availableButcherTable = null;
                bool hasSimpleMealBill = false;
                bool hasButcheringBill = false;
                foreach (Thing thing in map.listerThings.AllThings)
                {
                    var workTable = thing as Building_WorkTable;
                    if (workTable == null ||
                        workTable.BillStack == null)
                    {
                        continue;
                    }

                    foreach (Bill bill in workTable.BillStack.Bills)
                    {
                        if (simpleMealRecipe != null && bill.recipe == simpleMealRecipe)
                        {
                            hasSimpleMealBill = true;
                        }

                        if (butcheringRecipe != null && bill.recipe == butcheringRecipe)
                        {
                            hasButcheringBill = true;
                        }
                    }

                    if (simpleMealRecipe != null &&
                        availableStove == null &&
                        workTable.def.defName.Contains("Stove") &&
                        simpleMealRecipe.AvailableOnNow(workTable, null))
                    {
                        availableStove = workTable;
                    }

                    if (butcheringRecipe != null &&
                        availableButcherTable == null &&
                        butcheringRecipe.AvailableOnNow(workTable, null))
                    {
                        availableButcherTable = workTable;
                    }
                }

                if (!hasSimpleMealBill && availableStove != null)
                {
                    var mealBill = new Bill_Production(simpleMealRecipe, null);
                    mealBill.repeatMode = BillRepeatModeDefOf.TargetCount;
                    mealBill.targetCount = Math.Min(120, Math.Max(20, map.mapPawns.FreeColonists.Count * 4));
                    mealBill.ingredientFilter.SetAllow(ThingDefOf.Meat_Human, false);
                    mealBill.SetStoreMode(BillStoreModeDefOf.BestStockpile, null);
                    availableStove.BillStack.AddBill(mealBill);
                }

                if (!hasButcheringBill && availableButcherTable != null)
                {
                    var butcheringBill = new Bill_Production(butcheringRecipe, null);
                    butcheringBill.repeatMode = BillRepeatModeDefOf.Forever;
                    butcheringBill.ingredientFilter.SetAllow(
                        ThingCategoryDefOf.CorpsesHumanlike,
                        false,
                        new List<ThingDef>(),
                        new List<SpecialThingFilterDef>());
                    butcheringBill.SetStoreMode(BillStoreModeDefOf.BestStockpile, null);
                    availableButcherTable.BillStack.AddBill(butcheringBill);
                }
            }
        }

        private static void ManageStockpiles()
        {
            foreach (Map map in Find.Maps)
            {
                if (!map.IsPlayerHome || map.mapPawns.FreeColonists.Count == 0)
                {
                    continue;
                }

                bool hasStockpile = false;
                foreach (Zone zone in map.zoneManager.AllZones)
                {
                    if (zone is Zone_Stockpile)
                    {
                        hasStockpile = true;
                        break;
                    }
                }

                if (!hasStockpile)
                {
                    CreateGeneralStockpile(map, map.mapPawns.FreeColonists[0].Position);
                }
            }
        }

        private static void ManageBaseDefense()
        {
            foreach (Map map in Find.Maps)
            {
                var colonists = map.mapPawns.FreeColonists;
                if (!map.IsPlayerHome || colonists.Count == 0)
                {
                    continue;
                }

                ThingDef sandbagStuff = GenStuff.DefaultStuffFor(ThingDefOf.Sandbags);
                if (sandbagStuff == null)
                {
                    continue;
                }

                int existingSandbags = 0;
                int pendingSandbags = 0;
                int availableStuff = 0;
                foreach (Thing thing in map.listerThings.AllThings)
                {
                    if (thing.def == sandbagStuff)
                    {
                        availableStuff += thing.stackCount;
                    }

                    if ((thing.def == ThingDefOf.Sandbags && thing.Faction == Faction.OfPlayer) ||
                        (thing is Blueprint_Build blueprint &&
                         blueprint.BuildDef == ThingDefOf.Sandbags &&
                         blueprint.Faction == Faction.OfPlayer))
                    {
                        existingSandbags++;
                        if (thing is Blueprint_Build)
                        {
                            pendingSandbags++;
                        }
                    }
                }

                int targetSandbags = Math.Min(MaxDefenseSandbags, Math.Max(4, colonists.Count * 2));
                int missingSandbags = targetSandbags - existingSandbags;
                int materialLimit = Math.Max(
                    0,
                    availableStuff / ThingDefOf.Sandbags.costStuffCount - pendingSandbags);
                int toPlace = Math.Min(
                    Math.Min(missingSandbags, DefenseBlueprintsPerUpdate),
                    materialLimit);
                if (toPlace <= 0)
                {
                    continue;
                }

                IntVec3 center = FindColonyCenter(map, colonists);
                PlaceDefenseSandbags(map, center, sandbagStuff, toPlace);
            }
        }

        private static IntVec3 FindColonyCenter(Map map, List<Pawn> colonists)
        {
            long totalX = 0;
            long totalZ = 0;
            int total = 0;
            foreach (Thing thing in map.listerThings.AllThings)
            {
                var building = thing as Building;
                if (building == null ||
                    building.Faction != Faction.OfPlayer ||
                    building.def == ThingDefOf.Sandbags)
                {
                    continue;
                }

                totalX += building.Position.x;
                totalZ += building.Position.z;
                total++;
            }

            if (total == 0)
            {
                foreach (Pawn pawn in colonists)
                {
                    totalX += pawn.Position.x;
                    totalZ += pawn.Position.z;
                    total++;
                }
            }

            return new IntVec3((int)(totalX / total), 0, (int)(totalZ / total));
        }

        private static void PlaceDefenseSandbags(
            Map map,
            IntVec3 center,
            ThingDef stuff,
            int countToPlace)
        {
            int seedOffset = (map.ConstantRandSeed % 4 + 4) % 4;
            int bestDirection = -1;
            int bestScore = int.MinValue;
            for (int direction = 0; direction < 4; direction++)
            {
                int dx = direction == 1 ? 1 : direction == 3 ? -1 : 0;
                int dz = direction == 0 ? 1 : direction == 2 ? -1 : 0;
                int perpendicularX = -dz;
                int perpendicularZ = dx;
                var lineCenter = new IntVec3(center.x + dx * 10, 0, center.z + dz * 10);
                int validCells = 0;
                int fertilityPenalty = 0;
                for (int offset = -2; offset <= 2; offset++)
                {
                    var cell = new IntVec3(
                        lineCenter.x + perpendicularX * offset,
                        0,
                        lineCenter.z + perpendicularZ * offset);
                    if (!CanPlaceDefenseSandbag(map, cell, stuff))
                    {
                        continue;
                    }

                    validCells++;
                    fertilityPenalty += (int)(map.fertilityGrid.FertilityAt(cell) * 10f);
                }

                int seedTieBreaker = (4 - (direction - seedOffset + 4) % 4);
                int score = validCells * 100 - fertilityPenalty + seedTieBreaker;
                if (score > bestScore)
                {
                    bestScore = score;
                    bestDirection = direction;
                }
            }

            if (bestDirection < 0 || bestScore < 100)
            {
                return;
            }

            int bestDx = bestDirection == 1 ? 1 : bestDirection == 3 ? -1 : 0;
            int bestDz = bestDirection == 0 ? 1 : bestDirection == 2 ? -1 : 0;
            int bestPerpendicularX = -bestDz;
            int bestPerpendicularZ = bestDx;
            var bestLineCenter = new IntVec3(center.x + bestDx * 10, 0, center.z + bestDz * 10);
            int placed = 0;
            for (int offset = -2; offset <= 2 && placed < countToPlace; offset++)
            {
                var cell = new IntVec3(
                    bestLineCenter.x + bestPerpendicularX * offset,
                    0,
                    bestLineCenter.z + bestPerpendicularZ * offset);
                if (!CanPlaceDefenseSandbag(map, cell, stuff))
                {
                    continue;
                }

                GenConstruct.PlaceBlueprintForBuild(
                    ThingDefOf.Sandbags,
                    cell,
                    map,
                    Rot4.North,
                    Faction.OfPlayer,
                    stuff,
                    null,
                    null,
                    true);
                placed++;
            }
        }

        private static bool CanPlaceDefenseSandbag(Map map, IntVec3 cell, ThingDef stuff)
        {
            if (!cell.InBounds(map) ||
                !cell.Walkable(map) ||
                map.roofGrid.Roofed(cell) ||
                map.zoneManager.ZoneAt(cell) != null)
            {
                return false;
            }

            AcceptanceReport placement = GenConstruct.CanPlaceBlueprintAt(
                ThingDefOf.Sandbags,
                cell,
                Rot4.North,
                map,
                false,
                null,
                null,
                stuff,
                false,
                false,
                false);
            return placement.Accepted;
        }

        private void UpdateFoodConsumptionEstimate(int currentTick)
        {
            if (lastFoodSampleTick > 0 &&
                currentTick - lastFoodSampleTick < FoodObservationIntervalTicks)
            {
                return;
            }

            float foodNutrition = 0f;
            int colonistCount = 0;
            foreach (Map map in Find.Maps)
            {
                if (!map.IsPlayerHome)
                {
                    continue;
                }

                foodNutrition += map.resourceCounter.TotalHumanEdibleNutrition;
                colonistCount += map.mapPawns.FreeColonists.Count;
            }

            if (colonistCount == 0)
            {
                lastFoodSampleTick = currentTick;
                lastFoodSampleNutrition = foodNutrition;
                lastFoodSampleColonistCount = 0;
                return;
            }

            if (lastFoodSampleTick > 0 &&
                lastFoodSampleColonistCount > 0 &&
                currentTick > lastFoodSampleTick &&
                foodNutrition < lastFoodSampleNutrition)
            {
                float elapsedDays = (currentTick - lastFoodSampleTick) / 60000f;
                float averageColonists = (colonistCount + lastFoodSampleColonistCount) / 2f;
                float observedDailyUse = (lastFoodSampleNutrition - foodNutrition) /
                    (elapsedDays * averageColonists);
                if (observedDailyUse > 0f)
                {
                    estimatedDailyFoodUsePerColonist = estimatedDailyFoodUsePerColonist <= 0f
                        ? observedDailyUse
                        : estimatedDailyFoodUsePerColonist * 0.75f + observedDailyUse * 0.25f;
                }
            }

            lastFoodSampleTick = currentTick;
            lastFoodSampleNutrition = foodNutrition;
            lastFoodSampleColonistCount = colonistCount;
        }

        private float AdaptiveFoodReservePerColonist()
        {
            if (estimatedDailyFoodUsePerColonist <= 0f)
            {
                return FoodReservePerColonist;
            }

            return Math.Min(
                FoodReservePerColonist,
                Math.Max(CriticalFoodReservePerColonist, estimatedDailyFoodUsePerColonist * FoodReserveDays));
        }

        private int AdaptiveMedicineReserve()
        {
            int colonistCount = 0;
            int colonistsNeedingTreatment = 0;
            foreach (Map map in Find.Maps)
            {
                if (!map.IsPlayerHome)
                {
                    continue;
                }

                foreach (Pawn pawn in map.mapPawns.FreeColonists)
                {
                    colonistCount++;
                    if (pawn.health != null &&
                        pawn.health.hediffSet != null &&
                        pawn.health.hediffSet.HasTendableHediff(false))
                    {
                        colonistsNeedingTreatment++;
                    }
                }
            }

            return Math.Min(
                25,
                MedicineReserve + colonistsNeedingTreatment * 2 + colonistCount / 4);
        }

        private static void CreateGeneralStockpile(Map map, IntVec3 center)
        {
            int stockpileCellLimit = Math.Min(
                64,
                Math.Max(MinimumGeneralStockpileCells, map.mapPawns.FreeColonists.Count * 4));
            var cells = new List<IntVec3>();
            for (int radius = 0; radius <= 12 && cells.Count < stockpileCellLimit; radius++)
            {
                for (int x = Math.Max(0, center.x - radius); x <= Math.Min(map.Size.x - 1, center.x + radius); x++)
                {
                    for (int z = Math.Max(0, center.z - radius); z <= Math.Min(map.Size.z - 1, center.z + radius); z++)
                    {
                        if (Math.Max(Math.Abs(center.x - x), Math.Abs(center.z - z)) != radius)
                        {
                            continue;
                        }

                        var cell = new IntVec3(x, 0, z);
                        if (map.roofGrid.Roofed(cell) &&
                            map.zoneManager.ZoneAt(cell) == null &&
                            map.edificeGrid[cell] == null &&
                            cell.Walkable(map))
                        {
                            cells.Add(cell);
                            if (cells.Count == stockpileCellLimit)
                            {
                                break;
                            }
                        }
                    }

                    if (cells.Count == stockpileCellLimit)
                    {
                        break;
                    }
                }
            }

            if (cells.Count < MinimumGeneralStockpileCells)
            {
                return;
            }

            var stockpile = new Zone_Stockpile(StorageSettingsPreset.DefaultStockpile, map.zoneManager);
            map.zoneManager.RegisterZone(stockpile);
            stockpile.RenamableLabel = ColonyPilotStockpileLabel;
            foreach (IntVec3 cell in cells)
            {
                stockpile.AddCell(cell);
            }
        }

        private void ManageTrading()
        {
            Dialog_Trade tradeDialog = null;
            foreach (Window window in Find.WindowStack.Windows)
            {
                tradeDialog = window as Dialog_Trade;
                if (tradeDialog != null)
                {
                    break;
                }
            }

            if (tradeDialog == null ||
                TradeSession.deal == null ||
                TradeSession.trader == null)
            {
                handledTradeDialog = null;
                return;
            }

            if (ReferenceEquals(handledTradeDialog, tradeDialog))
            {
                return;
            }

            handledTradeDialog = tradeDialog;
            if (TradeSession.giftMode)
            {
                if (ColonyPilotMod.Settings.manageDiplomacy)
                {
                    ExecuteAutomaticGift(tradeDialog, TradeSession.deal);
                }

                return;
            }

            if (ColonyPilotMod.Settings.manageTrading)
            {
                ExecuteAutomaticTrade(tradeDialog, TradeSession.deal);
            }
        }

        private void ExecuteAutomaticGift(Dialog_Trade tradeDialog, TradeDeal deal)
        {
            Faction faction = TradeSession.trader.Faction;
            if (faction == null ||
                faction.IsPlayer ||
                faction.def == null ||
                !faction.def.CanEverBeNonHostile ||
                faction.RelationKindWith(Faction.OfPlayer) == FactionRelationKind.Hostile ||
                faction.GoodwillWith(Faction.OfPlayer) >= GiftGoodwillTarget)
            {
                return;
            }

            float remainingValue = GiftValueLimit;
            bool selectedGift = false;
            foreach (Tradeable tradeable in deal.AllTradeables)
            {
                tradeable.AdjustTo(0);
                ThingDef thingDef = tradeable.ThingDef;
                if (thingDef == null ||
                    tradeable.IsCurrency ||
                    !tradeable.TraderWillTrade ||
                    !CanSellSurplus(thingDef) ||
                    tradeable.BaseMarketValue <= 0f)
                {
                    continue;
                }

                int colonyCount = tradeable.CountHeldBy(Transactor.Colony);
                if (colonyCount <= SurplusStockLimit)
                {
                    continue;
                }

                int maxGiftByValue = (int)Math.Floor(remainingValue / tradeable.BaseMarketValue);
                int giftCount = Math.Min(colonyCount - SurplusKeepCount, maxGiftByValue);
                int givenCount = SetTradeCount(tradeable, giftCount, false);
                if (givenCount <= 0)
                {
                    continue;
                }

                remainingValue -= givenCount * tradeable.BaseMarketValue;
                selectedGift = true;
                if (remainingValue < tradeable.BaseMarketValue)
                {
                    break;
                }
            }

            if (!selectedGift)
            {
                return;
            }

            bool actuallyTraded;
            if (!deal.TryExecute(out actuallyTraded) || !actuallyTraded)
            {
                Log.Warning("Colony Pilot could not complete its automatic goodwill gift; the trade window was left open.");
                Messages.Message(
                    "ColonyPilot.AutoTradeFailed".Translate(),
                    null,
                    MessageTypeDefOf.NegativeEvent,
                    false);
                return;
            }

            TradeSession.Close();
            tradeDialog.Close(false);
            Messages.Message(
                "ColonyPilot.DiplomaticGiftComplete".Translate(faction.Name),
                null,
                MessageTypeDefOf.PositiveEvent,
                false);
        }

        private void ExecuteAutomaticTrade(Dialog_Trade tradeDialog, TradeDeal deal)
        {
            float foodNutrition = 0f;
            int colonistCount = 0;
            foreach (Map map in Find.Maps)
            {
                if (map.IsPlayerHome)
                {
                    foodNutrition += map.resourceCounter.TotalHumanEdibleNutrition;
                    colonistCount += map.mapPawns.FreeColonists.Count;
                }
            }

            float foodTarget = colonistCount * AdaptiveFoodReservePerColonist();
            int medicineTarget = AdaptiveMedicineReserve();
            int medicineCount = 0;
            foreach (Tradeable tradeable in deal.AllTradeables)
            {
                if (tradeable.ThingDef != null && tradeable.ThingDef.IsMedicine)
                {
                    medicineCount += tradeable.CountHeldBy(Transactor.Colony);
                }
            }

            var purchaseTradeables = new List<Tradeable>();
            foreach (Tradeable tradeable in deal.AllTradeables)
            {
                tradeable.AdjustTo(0);
                if (tradeable.IsCurrency || !tradeable.TraderWillTrade)
                {
                    continue;
                }

                ThingDef thingDef = tradeable.ThingDef;
                if (thingDef == null)
                {
                    continue;
                }

                int traderCount = tradeable.CountHeldBy(Transactor.Trader);
                int colonyCount = tradeable.CountHeldBy(Transactor.Colony);
                if (thingDef.IsNutritionGivingIngestible &&
                    thingDef.ingestible != null &&
                    thingDef.ingestible.HumanEdible &&
                    thingDef.ingestible.CachedNutrition > 0f &&
                    foodNutrition < foodTarget &&
                    traderCount > 0)
                {
                    int countNeeded = (int)Math.Ceiling(
                        (foodTarget - foodNutrition) / thingDef.ingestible.CachedNutrition);
                    int bought = SetTradeCount(tradeable, Math.Min(countNeeded, traderCount), true);
                    if (bought > 0)
                    {
                        foodNutrition += bought * thingDef.ingestible.CachedNutrition;
                        purchaseTradeables.Add(tradeable);
                    }
                }
                else if (thingDef.IsMedicine &&
                         medicineCount < medicineTarget &&
                         traderCount > 0)
                {
                    int bought = SetTradeCount(
                        tradeable,
                        Math.Min(medicineTarget - medicineCount, traderCount),
                        true);
                    if (bought > 0)
                    {
                        medicineCount += bought;
                        purchaseTradeables.Add(tradeable);
                    }
                }
                else if (CanSellSurplus(thingDef) && colonyCount > SurplusStockLimit)
                {
                    SetTradeCount(tradeable, colonyCount - SurplusKeepCount, false);
                }
            }

            deal.UpdateCurrencyCount();
            if (purchaseTradeables.Count > 0 &&
                (deal.CurrencyTradeable == null ||
                 deal.CurrencyTradeable.CountPostDealFor(Transactor.Colony) < SilverReserve))
            {
                foreach (Tradeable tradeable in purchaseTradeables)
                {
                    tradeable.AdjustTo(0);
                }

                deal.UpdateCurrencyCount();
                Messages.Message(
                    "ColonyPilot.AutoTradeReserve".Translate(),
                    null,
                    MessageTypeDefOf.NeutralEvent,
                    false);
            }

            bool hasTrade = false;
            foreach (Tradeable tradeable in deal.AllTradeables)
            {
                if (!tradeable.IsCurrency && tradeable.CountToTransfer != 0)
                {
                    hasTrade = true;
                    break;
                }
            }

            if (!hasTrade)
            {
                return;
            }

            bool actuallyTraded;
            if (!deal.TryExecute(out actuallyTraded) || !actuallyTraded)
            {
                Log.Warning("Colony Pilot could not complete its automatic trade; the trade window was left open.");
                Messages.Message(
                    "ColonyPilot.AutoTradeFailed".Translate(),
                    null,
                    MessageTypeDefOf.NegativeEvent,
                    false);
                return;
            }

            TradeSession.Close();
            tradeDialog.Close(false);
            Messages.Message(
                "ColonyPilot.AutoTradeComplete".Translate(),
                null,
                MessageTypeDefOf.PositiveEvent,
                false);
        }

        private static int SetTradeCount(Tradeable tradeable, int desiredCount, bool transferToColony)
        {
            if (desiredCount <= 0)
            {
                return 0;
            }

            tradeable.AdjustTo(0);
            int colonyCountAtZero = tradeable.CountPostDealFor(Transactor.Colony);
            int maximum = tradeable.GetMaximumToTransfer();
            int minimum = tradeable.GetMinimumToTransfer();

            tradeable.AdjustTo(maximum);
            int colonyCountAtMaximum = tradeable.CountPostDealFor(Transactor.Colony);
            tradeable.AdjustTo(minimum);
            int colonyCountAtMinimum = tradeable.CountPostDealFor(Transactor.Colony);

            bool maximumTransfersToColony = colonyCountAtMaximum >= colonyCountAtMinimum;
            int transferLimit = transferToColony
                ? (maximumTransfersToColony ? maximum : minimum)
                : (maximumTransfersToColony ? minimum : maximum);
            if (transferLimit == 0)
            {
                tradeable.AdjustTo(0);
                return 0;
            }

            int amount = Math.Min(desiredCount, Math.Abs(transferLimit));
            int selectedCount = Math.Sign(transferLimit) * amount;
            tradeable.AdjustTo(selectedCount);
            int colonyCountAfterTrade = tradeable.CountPostDealFor(Transactor.Colony);
            return transferToColony
                ? Math.Max(0, colonyCountAfterTrade - colonyCountAtZero)
                : Math.Max(0, colonyCountAtZero - colonyCountAfterTrade);
        }

        private static bool CanSellSurplus(ThingDef thingDef)
        {
            return !thingDef.IsNutritionGivingIngestible &&
                !thingDef.IsMedicine &&
                !thingDef.IsStuff &&
                !thingDef.IsWeapon &&
                !thingDef.IsApparel &&
                !thingDef.tradeNeverStack;
        }

        private void ManageShelter()
        {
            ProgressShelterProjects();

            foreach (Map map in Find.Maps)
            {
                if (!map.IsPlayerHome)
                {
                    continue;
                }

                var colonists = map.mapPawns.FreeColonists;
                if (colonists.Count == 0)
                {
                    continue;
                }

                int sleepingSlots = CountColonistSleepingSlots(map);
                for (int i = sleepingSlots; i < colonists.Count; i++)
                {
                    if (!TryPlaceSleepingSpot(map, colonists[i].Position))
                    {
                        if (!HasShelterProject(map))
                        {
                            TryPlanStarterShelter(map, colonists[i].Position);
                        }

                        break;
                    }

                    sleepingSlots++;
                }
            }
        }

        private bool HasShelterProject(Map map)
        {
            return shelterProjectMaps.Contains(map);
        }

        private bool TryPlanStarterShelter(Map map, IntVec3 center)
        {
            ThingDef wallStuff = GenStuff.DefaultStuffFor(ThingDefOf.Wall);
            ThingDef doorStuff = GenStuff.DefaultStuffFor(ThingDefOf.Door);
            if (wallStuff == null || doorStuff == null)
            {
                Log.Warning("Colony Pilot could not find default materials for its starter shelter.");
                return false;
            }

            for (int x = Math.Max(3, center.x - 5); x <= Math.Min(map.Size.x - 4, center.x + 5); x++)
            {
                for (int z = Math.Max(3, center.z - 5); z <= Math.Min(map.Size.z - 4, center.z + 5); z++)
                {
                    var site = new IntVec3(x, 0, z);
                    if (!IsValidShelterSite(map, site))
                    {
                        continue;
                    }

                    bool canBuildWholeShelter = true;
                    for (int dx = -3; dx <= 3 && canBuildWholeShelter; dx++)
                    {
                        for (int dz = -3; dz <= 3; dz++)
                        {
                            if (Math.Abs(dx) != 3 && Math.Abs(dz) != 3)
                            {
                                continue;
                            }

                            bool doorCell = dx == 0 && dz == 3;
                            ThingDef buildDef = doorCell ? ThingDefOf.Door : ThingDefOf.Wall;
                            ThingDef stuff = doorCell ? doorStuff : wallStuff;
                            var cell = new IntVec3(x + dx, 0, z + dz);
                            AcceptanceReport placement = GenConstruct.CanPlaceBlueprintAt(
                                buildDef,
                                cell,
                                Rot4.North,
                                map,
                                false,
                                null,
                                null,
                                stuff,
                                false,
                                false,
                                false);
                            if (!placement.Accepted)
                            {
                                canBuildWholeShelter = false;
                                break;
                            }
                        }
                    }

                    if (!canBuildWholeShelter)
                    {
                        continue;
                    }

                    shelterSiteWarningSent = false;
                    shelterProjectMaps.Add(map);
                    shelterProjectCenters.Add(site);
                    PlaceShelterBlueprints(map, site, wallStuff, doorStuff);
                    return true;
                }
            }

            if (!shelterSiteWarningSent)
            {
                Log.Warning("Colony Pilot could not find a clear location for its starter shelter.");
                shelterSiteWarningSent = true;
            }

            return false;
        }

        private static bool IsValidShelterSite(Map map, IntVec3 center)
        {
            for (int dx = -3; dx <= 3; dx++)
            {
                for (int dz = -3; dz <= 3; dz++)
                {
                    var cell = new IntVec3(center.x + dx, 0, center.z + dz);
                    if (!cell.InBounds(map) ||
                        map.edificeGrid[cell] != null ||
                        map.roofGrid.Roofed(cell) ||
                        map.zoneManager.ZoneAt(cell) != null ||
                        !cell.Walkable(map))
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        private void ProgressShelterProjects()
        {
            for (int i = shelterProjectMaps.Count - 1; i >= 0; i--)
            {
                Map map = shelterProjectMaps[i];
                if (map == null || !map.IsPlayerHome || !Find.Maps.Contains(map))
                {
                    RemoveShelterProjectAt(i);
                    continue;
                }

                IntVec3 center = shelterProjectCenters[i];
                ThingDef wallStuff = GenStuff.DefaultStuffFor(ThingDefOf.Wall);
                ThingDef doorStuff = GenStuff.DefaultStuffFor(ThingDefOf.Door);
                if (wallStuff == null || doorStuff == null)
                {
                    continue;
                }

                PlaceShelterBlueprints(map, center, wallStuff, doorStuff);
                if (ShelterWallsComplete(map, center))
                {
                    for (int dx = -2; dx <= 2; dx++)
                    {
                        for (int dz = -2; dz <= 2; dz++)
                        {
                            var cell = new IntVec3(center.x + dx, 0, center.z + dz);
                            if (!map.roofGrid.Roofed(cell))
                            {
                                map.roofGrid.SetRoof(cell, RoofDefOf.RoofConstructed);
                            }
                        }
                    }

                    RemoveShelterProjectAt(i);
                }
            }
        }

        private static void PlaceShelterBlueprints(
            Map map,
            IntVec3 center,
            ThingDef wallStuff,
            ThingDef doorStuff)
        {
            var pendingCells = new HashSet<IntVec3>();
            foreach (Thing thing in map.listerThings.AllThings)
            {
                var blueprint = thing as Blueprint_Build;
                if (blueprint != null &&
                    blueprint.Faction == Faction.OfPlayer &&
                    (blueprint.BuildDef == ThingDefOf.Wall || blueprint.BuildDef == ThingDefOf.Door))
                {
                    pendingCells.Add(blueprint.Position);
                }
            }

            int placed = 0;
            for (int dx = -3; dx <= 3 && placed < ShelterBlueprintsPerUpdate; dx++)
            {
                for (int dz = -3; dz <= 3 && placed < ShelterBlueprintsPerUpdate; dz++)
                {
                    if (Math.Abs(dx) != 3 && Math.Abs(dz) != 3)
                    {
                        continue;
                    }

                    bool doorCell = dx == 0 && dz == 3;
                    ThingDef buildDef = doorCell ? ThingDefOf.Door : ThingDefOf.Wall;
                    ThingDef stuff = doorCell ? doorStuff : wallStuff;
                    var cell = new IntVec3(center.x + dx, 0, center.z + dz);
                    Building edifice = map.edificeGrid[cell];
                    if ((edifice != null &&
                         edifice.Faction == Faction.OfPlayer &&
                         (doorCell ? edifice.def.IsDoor : edifice.def.IsWall)) ||
                        pendingCells.Contains(cell))
                    {
                        continue;
                    }

                    AcceptanceReport placement = GenConstruct.CanPlaceBlueprintAt(
                        buildDef,
                        cell,
                        Rot4.North,
                        map,
                        false,
                        null,
                        null,
                        stuff,
                        false,
                        false,
                        false);
                    if (!placement.Accepted)
                    {
                        continue;
                    }

                    GenConstruct.PlaceBlueprintForBuild(
                        buildDef,
                        cell,
                        map,
                        Rot4.North,
                        Faction.OfPlayer,
                        stuff,
                        null,
                        null,
                        true);
                    pendingCells.Add(cell);
                    placed++;
                }
            }
        }

        private static bool ShelterWallsComplete(Map map, IntVec3 center)
        {
            for (int dx = -3; dx <= 3; dx++)
            {
                for (int dz = -3; dz <= 3; dz++)
                {
                    if (Math.Abs(dx) != 3 && Math.Abs(dz) != 3)
                    {
                        continue;
                    }

                    bool doorCell = dx == 0 && dz == 3;
                    Building edifice = map.edificeGrid[new IntVec3(center.x + dx, 0, center.z + dz)];
                    if (edifice == null ||
                        edifice.Faction != Faction.OfPlayer ||
                        !(doorCell ? edifice.def.IsDoor : edifice.def.IsWall))
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        private void RemoveShelterProjectAt(int index)
        {
            shelterProjectMaps.RemoveAt(index);
            shelterProjectCenters.RemoveAt(index);
        }

        private static int CountColonistSleepingSlots(Map map)
        {
            int sleepingSlots = 0;
            foreach (Thing thing in map.listerThings.AllThings)
            {
                if (thing is Building_Bed bed && bed.ForColonists && !bed.Medical)
                {
                    sleepingSlots += bed.TotalSleepingSlots;
                }
                else if (thing.def == ThingDefOf.SleepingSpot ||
                         (thing is Blueprint_Build blueprint &&
                          (blueprint.BuildDef == ThingDefOf.Bed ||
                           blueprint.BuildDef == ThingDefOf.SleepingSpot)))
                {
                    sleepingSlots++;
                }
            }

            return sleepingSlots;
        }

        private static bool TryPlaceSleepingSpot(Map map, IntVec3 center)
        {
            for (int x = center.x - 8; x <= center.x + 8; x++)
            {
                for (int z = center.z - 8; z <= center.z + 8; z++)
                {
                    if (x < 0 || x >= map.Size.x || z < 0 || z >= map.Size.z)
                    {
                        continue;
                    }

                    var cell = new IntVec3(x, 0, z);
                    if (!map.roofGrid.Roofed(cell) || map.zoneManager.ZoneAt(cell) != null)
                    {
                        continue;
                    }

                    AcceptanceReport placement = GenConstruct.CanPlaceBlueprintAt(
                        ThingDefOf.SleepingSpot,
                        cell,
                        Rot4.North,
                        map,
                        false,
                        null,
                        null,
                        null,
                        false,
                        false,
                        false);
                    if (!placement.Accepted)
                    {
                        continue;
                    }

                    GenConstruct.PlaceBlueprintForBuild(
                        ThingDefOf.SleepingSpot,
                        cell,
                        map,
                        Rot4.North,
                        Faction.OfPlayer,
                        null,
                        null,
                        null,
                        true);
                    return true;
                }
            }

            return false;
        }

        private void ManageFarming()
        {
            foreach (Map map in Find.Maps)
            {
                var colonists = map.mapPawns.FreeColonists;
                if (!map.IsPlayerHome || colonists.Count == 0)
                {
                    continue;
                }

                int colonyPilotFarmCount = 0;
                bool hasOtherGrowingZone = false;
                foreach (Zone zone in map.zoneManager.AllZones)
                {
                    if (!(zone is Zone_Growing))
                    {
                        continue;
                    }

                    if (zone.RenamableLabel == ColonyPilotFarmLabel ||
                        zone.RenamableLabel == ColonyPilotReserveFarmLabel)
                    {
                        colonyPilotFarmCount++;
                    }
                    else
                    {
                        hasOtherGrowingZone = true;
                    }
                }

                float foodReserve = map.resourceCounter.TotalHumanEdibleNutrition;
                float reservePerColonist = AdaptiveFoodReservePerColonist();
                if (colonyPilotFarmCount == 0 &&
                    !hasOtherGrowingZone &&
                    foodReserve < colonists.Count * reservePerColonist)
                {
                    CreateFoodFarm(map, colonists[0].Position, ColonyPilotFarmLabel);
                }
                else if (colonyPilotFarmCount == 1 &&
                         !hasOtherGrowingZone &&
                         foodReserve < colonists.Count *
                            Math.Max(CriticalFoodReservePerColonist, reservePerColonist / 3f))
                {
                    CreateFoodFarm(map, colonists[0].Position, ColonyPilotReserveFarmLabel);
                }
            }
        }

        private static void CreateFoodFarm(Map map, IntVec3 center, string label)
        {
            var cells = new System.Collections.Generic.List<IntVec3>();
            for (int x = center.x - 6; x <= center.x + 5 && cells.Count < FarmCellLimit; x++)
            {
                for (int z = center.z - 6; z <= center.z + 5 && cells.Count < FarmCellLimit; z++)
                {
                    if (x < 0 || x >= map.Size.x || z < 0 || z >= map.Size.z)
                    {
                        continue;
                    }

                    var cell = new IntVec3(x, 0, z);
                    if (map.zoneManager.ZoneAt(cell) != null ||
                        map.edificeGrid[cell] != null ||
                        map.roofGrid.Roofed(cell) ||
                        map.fertilityGrid.FertilityAt(cell) < 0.7f)
                    {
                        continue;
                    }

                    cells.Add(cell);
                }
            }

            if (cells.Count < MinimumFarmCells)
            {
                return;
            }

            var zone = new Zone_Growing(map.zoneManager);
            map.zoneManager.RegisterZone(zone);
            zone.RenamableLabel = label;
            foreach (IntVec3 cell in cells)
            {
                zone.AddCell(cell);
            }

            zone.SetPlantDefToGrow(ThingDefOf.Plant_Potato);
        }

        private static void SelectResearchProject()
        {
            foreach (ResearchProjectDef project in DefDatabase<ResearchProjectDef>.AllDefsListForReading)
            {
                if (Find.ResearchManager.IsCurrentProject(project) && !project.IsFinished)
                {
                    return;
                }
            }

            foreach (ResearchProjectDef project in DefDatabase<ResearchProjectDef>.AllDefsListForReading)
            {
                if (!project.IsFinished && project.CanStartNow)
                {
                    Find.ResearchManager.SetCurrentProject(project);
                    return;
                }
            }
        }

        private static bool HasHostileThreats()
        {
            foreach (Map map in Find.Maps)
            {
                foreach (Pawn pawn in map.mapPawns.AllPawns)
                {
                    if (pawn.Spawned && pawn.HostileTo(Faction.OfPlayer))
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        private void ManageCombat()
        {
            foreach (Map map in Find.Maps)
            {
                foreach (Pawn pawn in map.mapPawns.FreeColonists)
                {
                    if (!pawn.Spawned ||
                        pawn.Downed ||
                        pawn.drafter == null ||
                        pawn.WorkTagIsDisabled(WorkTags.Violent))
                    {
                        continue;
                    }

                    Pawn target = FindAttackTarget(pawn, map);
                    if (target == null)
                    {
                        continue;
                    }

                    JobDef currentJob = pawn.CurJobDef;
                    if (currentJob == JobDefOf.AttackStatic || currentJob == JobDefOf.AttackMelee)
                    {
                        continue;
                    }

                    bool wasDrafted = pawn.drafter.Drafted;
                    if (!wasDrafted)
                    {
                        pawn.drafter.Drafted = true;
                        if (!autoDraftedPawns.Contains(pawn))
                        {
                            autoDraftedPawns.Add(pawn);
                        }
                    }

                    if (!pawn.TryStartAttack(new LocalTargetInfo(target)) && !wasDrafted)
                    {
                        pawn.drafter.Drafted = false;
                        autoDraftedPawns.Remove(pawn);
                    }
                }
            }
        }

        private static Pawn FindAttackTarget(Pawn pawn, Map map)
        {
            Pawn closestTarget = null;
            int closestDistance = int.MaxValue;
            foreach (Pawn candidate in map.mapPawns.AllPawns)
            {
                if (!candidate.Spawned ||
                    candidate.Downed ||
                    !candidate.HostileTo(Faction.OfPlayer) ||
                    pawn.TryGetAttackVerb(candidate, true, false) == null)
                {
                    continue;
                }

                int distance = pawn.Position.DistanceToSquared(candidate.Position);
                if (distance < closestDistance)
                {
                    closestTarget = candidate;
                    closestDistance = distance;
                }
            }

            return closestTarget;
        }

        private void ReleaseAutoDraftedPawns()
        {
            for (int i = autoDraftedPawns.Count - 1; i >= 0; i--)
            {
                Pawn pawn = autoDraftedPawns[i];
                if (pawn != null && pawn.drafter != null && pawn.drafter.Drafted)
                {
                    pawn.drafter.Drafted = false;
                }

                autoDraftedPawns.RemoveAt(i);
            }
        }

        private void BalanceWorkPriorities(Pawn pawn, ColonyNeeds needs)
        {
            if (pawn.workSettings == null || pawn.skills == null)
            {
                return;
            }

            foreach (WorkTypeDef workType in DefDatabase<WorkTypeDef>.AllDefsListForReading)
            {
                if (pawn.WorkTypeIsDisabled(workType))
                {
                    continue;
                }

                int priority;
                if (workType.defName == "Firefighter" || workType.defName == "Patient")
                {
                    priority = 1;
                }
                else
                {
                    float skill = pawn.skills.AverageOfRelevantSkillsFor(workType);
                    priority = skill >= 15f ? 1 :
                        skill >= 10f ? 2 :
                        skill >= 5f ? 3 : 4;

                    if (workType.defName == "Doctor" && needs.HasColonistNeedingTreatment)
                    {
                        priority = skill >= 8f ? 1 : Math.Min(priority, 2);
                    }

                    bool hasGrowingSkill = workType.relevantSkills != null &&
                        workType.relevantSkills.Contains(SkillDefOf.Plants);
                    bool hasCookingSkill = workType.relevantSkills != null &&
                        workType.relevantSkills.Contains(SkillDefOf.Cooking);
                    if (hasGrowingSkill && needs.FoodPerColonist < AdaptiveFoodReservePerColonist())
                    {
                        priority = Math.Min(priority, needs.FoodPerColonist < CriticalFoodReservePerColonist ? 1 : 2);
                    }

                    if (hasCookingSkill && needs.FoodPerColonist < AdaptiveFoodReservePerColonist())
                    {
                        priority = Math.Min(priority, needs.FoodPerColonist < CriticalFoodReservePerColonist ? 1 : 2);
                    }

                    bool hasConstructionSkill = workType.relevantSkills != null &&
                        workType.relevantSkills.Contains(SkillDefOf.Construction);
                    if (hasConstructionSkill && needs.HasConstructionWork)
                    {
                        priority = Math.Min(priority, 2);
                    }
                }

                pawn.workSettings.SetPriority(workType, priority);
            }
        }
    }
}
