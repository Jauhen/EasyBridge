//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// Progopts.h 
//
// constants used in GetProgramOption() and SetProgramOption() calls
//

// program option settings
enum progopts {
	// GIB options
	tszGIBPath,
	tbEnableGIBForDeclarer,
	tbEnableGIBForDefender,
	tnGIBAnalysisTime,
	tnGIBSampleSize,
	tbShowGIBOutput,
	// counting options
	tnAggressivenessRating,
	tnHonorsValuationMode,
	tfAceValue,
	tfKingValue,
	tfQueenValue,
	tfJackValue,
	tfTenValue,
	tfCustomAceValue,
	tfCustomKingValue,
	tfCustomQueenValue,
	tfCustomJackValue,
	tfCustomTenValue,
	//
	tfDefaultMajorSuitGamePts,
	tfDefaultMinorSuitGamePts,
	tfDefaultNTGamePts,
	tfDefault4LevelPts,
	tfDefault3LevelPts,
	tfDefault2LevelPts,
	tfDefaultSlamPts,
	tfDefaultGrandSlamPts,
	//
	tfMajorSuitGamePts,
	tfMinorSuitGamePts,
	tfNTGamePts,
	tf4LevelPts,
	tf3LevelPts,
	tf2LevelPts,
	tfSlamPts,
	tfGrandSlamPts,
	//
	tb4AceBonus,
	tbAcelessPenalty,
	tbCountShortSuits,
	tbPenalizeUGHonors,
	// bidding config
	tnBiddingEngine,
	tbNNetTrainingMode,
	tfBiddingAggressiveness,
	tszNeuralNetFile,
	tnumNeuralNetInputs,
	tnumNeuralNetOutputs,
	tnumNeuralNetHiddenLayers,
	tnumNeuralNetUnitsPerHiddenLayer,
	// scoring options
	tbScoreHonorsBonuses,
};
