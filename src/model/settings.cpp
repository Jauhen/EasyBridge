#include "stdafx.h"
#include "engine/card_constants.h"
#include "model/settings.h"

//
const double c_tfDefaultMajorSuitGamePts = 26;
const double c_tfDefaultMinorSuitGamePts = 29;
const double c_tfDefaultNTGamePts = 26;
const double c_tfDefault4LevelPts = 26;
const double c_tfDefault3LevelPts = 23;
const double c_tfDefault2LevelPts = 20;
const double c_tfDefaultSlamPts = 33;
const double c_tfDefaultGrandSlamPts = 37;

// static data
double	Settings::m_fDefaultMajorSuitGamePts = c_tfDefaultMajorSuitGamePts;
double	Settings::m_fDefaultMinorSuitGamePts = c_tfDefaultMinorSuitGamePts;
double	Settings::m_fDefaultNTGamePts = c_tfDefaultNTGamePts;
double	Settings::m_fDefault4LevelPts = c_tfDefault4LevelPts;
double	Settings::m_fDefault3LevelPts = c_tfDefault3LevelPts;
double	Settings::m_fDefault2LevelPts = c_tfDefault2LevelPts;
double	Settings::m_fDefaultSlamPts = c_tfDefaultSlamPts;
double	Settings::m_fDefaultGrandSlamPts = c_tfDefaultGrandSlamPts;
//
double	Settings::m_fMajorSuitGamePts = c_tfDefaultMajorSuitGamePts;
double	Settings::m_fMinorSuitGamePts = c_tfDefaultMinorSuitGamePts;
double	Settings::m_fNTGamePts = c_tfDefaultNTGamePts;
double	Settings::m_f4LevelPts = c_tfDefault4LevelPts;
double	Settings::m_f3LevelPts = c_tfDefault3LevelPts;
double	Settings::m_f2LevelPts = c_tfDefault2LevelPts;
double	Settings::m_fSlamPts = c_tfDefaultSlamPts;
double	Settings::m_fGrandSlamPts = c_tfDefaultGrandSlamPts;


double Settings::m_fHonorValue[] = {
  // 0  1  2  3  4  5  6  7  8  9  T  J  Q  K  A
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
};

//
// default counting options
const int tnDefaultAceValue = 4;
const int tnDefaultKingValue = 3;
const int tnDefaultQueenValue = 2;
const int tnDefaultJackValue = 1;
const double tfGinsburgAceValue = 4.5;
const double tfGinsburgKingValue = 3.0;
const double tfGinsburgQueenValue = 1.5;
const double tfGinsburgJackValue = 0.8;


Settings::Settings() {
}

Settings::~Settings() {
}

void Settings::Initialize() {
}



//
// RefreshProperties()
//
// - refreshes info after properties have been changed
//
void Settings::RefreshProperties() {
  //
  InitHonorsValuations();
}


//
// InitHonorsValuations()
//
void Settings::InitHonorsValuations() {
  // set honors values
  switch (m_nHonorsValuationMode) {
    case 1:		// Ginsburg
      m_fAceValue = tfGinsburgAceValue;
      m_fKingValue = tfGinsburgKingValue;
      m_fQueenValue = tfGinsburgQueenValue;
      m_fJackValue = tfGinsburgJackValue;
      m_fTenValue = 0;
      break;
    case 2:		// custom
      m_fAceValue = m_fCustomAceValue;
      m_fKingValue = m_fCustomKingValue;
      m_fQueenValue = m_fCustomQueenValue;
      m_fJackValue = m_fCustomJackValue;
      m_fTenValue = 0;
      break;
    default:
      m_fAceValue = tnDefaultAceValue;
      m_fKingValue = tnDefaultKingValue;
      m_fQueenValue = tnDefaultQueenValue;
      m_fJackValue = tnDefaultJackValue;
      m_fTenValue = 0;
      break;
  }

  // fill the static array
  m_fHonorValue[ACE] = m_fAceValue;
  m_fHonorValue[KING] = m_fKingValue;
  m_fHonorValue[QUEEN] = m_fQueenValue;
  m_fHonorValue[JACK] = m_fJackValue;
  m_fHonorValue[TEN] = m_fTenValue;
}



//
// InitPointCountRequirements()
//
void Settings::InitPointCountRequirements() {
	// adjust point count requirements
	m_fMajorSuitGamePts = m_fDefaultMajorSuitGamePts - m_fBiddingAggressiveness;
	m_fMinorSuitGamePts = m_fDefaultMinorSuitGamePts - m_fBiddingAggressiveness;
	m_fNTGamePts = m_fDefaultNTGamePts - m_fBiddingAggressiveness;
	m_f4LevelPts = m_fDefault4LevelPts - m_fBiddingAggressiveness;
	m_f3LevelPts = m_fDefault3LevelPts - m_fBiddingAggressiveness;
	m_f2LevelPts = m_fDefault2LevelPts - m_fBiddingAggressiveness;
	m_fSlamPts = m_fDefaultSlamPts - m_fBiddingAggressiveness;
	m_fGrandSlamPts = m_fDefaultGrandSlamPts - m_fBiddingAggressiveness;
}

