// Configuration and options
export const enumOptions = {
  // Engine Configuration
  UrlApiStockfish: "option-url-api-stockfish",
  ApiStockfish: "option-api-stockfish",
  NumCores: "option-num-cores",
  HashtableRam: "option-hashtable-ram",
  Depth: "option-depth",
  MateFinderValue: "option-mate-finder-value",
  MultiPV: "option-multipv",
  HighMateChance: "option-highmatechance",

  // Auto Move Settings
  AutoMoveTime: "option-auto-move-time",
  AutoMoveTimeRandom: "option-auto-move-time-random",
  AutoMoveTimeRandomDiv: "option-auto-move-time-random-div",
  AutoMoveTimeRandomMulti: "option-auto-move-time-random-multi",
  LegitAutoMove: "option-legit-auto-move",
  BestMoveChance: "option-best-move-chance",
  RandomBestMove: "option-random-best-move",

  // Pre-move Settings
  Premove: "option-premove-enabled",
  MaxPreMoves: "option-max-premoves",
  PreMoveTime: "option-premove-time",
  PreMoveTimeRandom: "option-premove-time-random",
  PreMoveTimeRandomDiv: "option-premove-time-random-div",
  PreMoveTimeRandomMulti: "option-premove-time-random-multi",

  // Visual Settings
  ShowHints: "option-show-hints",
  TextToSpeech: "option-text-to-speech",
  MoveAnalysis: "option-move-analysis",
  DepthBar: "option-depth-bar",
  EvaluationBar: "option-evaluation-bar",
  ArrowColor: "option-arrow-color",

  // Advanced Features
  OpeningBook: "option-opening-book",
  Tablebase: "option-tablebase",
  NNUE: "option-nnue",
  FastMover: "option-fast-mover",
  HumanMode: "option-human-mode",
  HumanModeLevel: "option-human-mode-level",
  FloatingDepth: "option-floating-depth",
  GameAccuracy: "option-game-accuracy",
  LuaEnabled: "option-lua-enabled",

  // Additional Settings
  ShowThreats: "option-show-threats",
  ShowRefutations: "option-show-refutations",
  UseBookMoves: "option-use-book-moves",
  MaxBookLines: "option-max-book-lines"
};

// Default values for options
export const defaultOptions = {
  [enumOptions.UrlApiStockfish]: "",
  [enumOptions.ApiStockfish]: false,
  [enumOptions.NumCores]: 1,
  [enumOptions.HashtableRam]: 1024,
  [enumOptions.Depth]: 15,
  [enumOptions.MateFinderValue]: 0,
  [enumOptions.MultiPV]: 3,
  [enumOptions.HighMateChance]: false,
  [enumOptions.AutoMoveTime]: 5000,
  [enumOptions.AutoMoveTimeRandom]: 10000,
  [enumOptions.AutoMoveTimeRandomDiv]: 10,
  [enumOptions.AutoMoveTimeRandomMulti]: 1000,
  [enumOptions.LegitAutoMove]: false,
  [enumOptions.BestMoveChance]: 30,
  [enumOptions.RandomBestMove]: false,
  [enumOptions.Premove]: false,
  [enumOptions.MaxPreMoves]: 3,
  [enumOptions.PreMoveTime]: 1000,
  [enumOptions.PreMoveTimeRandom]: 500,
  [enumOptions.PreMoveTimeRandomDiv]: 100,
  [enumOptions.PreMoveTimeRandomMulti]: 1,
  [enumOptions.ShowHints]: true,
  [enumOptions.TextToSpeech]: false,
  [enumOptions.MoveAnalysis]: true,
  [enumOptions.DepthBar]: true,
  [enumOptions.EvaluationBar]: true,
  [enumOptions.ArrowColor]: "#00ff00",
  [enumOptions.OpeningBook]: true,
  [enumOptions.Tablebase]: true,
  [enumOptions.NNUE]: true,
  [enumOptions.FastMover]: 0,
  [enumOptions.HumanMode]: false,
  [enumOptions.HumanModeLevel]: "Intermediate",
  [enumOptions.FloatingDepth]: true,
  [enumOptions.GameAccuracy]: true,
  [enumOptions.LuaEnabled]: false,
  [enumOptions.ShowThreats]: false,
  [enumOptions.ShowRefutations]: false,
  [enumOptions.UseBookMoves]: true,
  [enumOptions.MaxBookLines]: 3
};

let settingsManager = null;

export function setSettingsManager(manager) {
    settingsManager = manager;
}

export function getValueConfig(key) {
    if (!settingsManager) return defaultOptions[key];
    return settingsManager.getSetting(key) ?? defaultOptions[key];
} 