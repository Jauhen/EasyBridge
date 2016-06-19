#ifndef EZ_BIDDING_CONVENTION_POOL_
#define EZ_BIDDING_CONVENTION_POOL_

#include "app_interface.h"
#include "4thSuitForcingConvention.h"
#include "StrongTwoBidsConvention.h"
#include "WeakTwoBidsConvention.h"
#include "ShutoutBidsConvention.h"
#include "Artificial2ClubConvention.h"
#include "StaymanConvention.h"
#include "JacobyTransferConvention.h"
#include "BlackwoodConvention.h"
#include "GerberConvention.h"
#include "CueBidConvention.h"
#include "SplinterBidsConvention.h"
#include "MichaelsCueBidConvention.h"
#include "UnusualNTConvention.h"
#include "Jacoby2NTConvention.h"
#include "Gambling3NTConvention.h"
#include "DruryConvention.h"
#include "NegativeDoublesConvention.h"
#include "TakeoutDoublesConvention.h"
#include "OvercallsConvention.h"


// Central repository for global convention objects
// only one copy of each convention object exists
// TODO(Jauhen): Convert to module once DI added.
class ConventionPool {
public:
  std::shared_ptr<CStrongTwoBidsConvention> strongTwoBidsConvention;
  std::shared_ptr<CWeakTwoBidsConvention> weakTwoBidsConvention;
  std::shared_ptr<CShutoutBidsConvention> shutoutBidsConvention;
  std::shared_ptr<CArtificial2ClubConvention> artificial2ClubConvention;
  std::shared_ptr<C4thSuitForcingConvention> fourthSuitForcingConvention;
  std::shared_ptr<CStaymanConvention> staymanConvention;
  std::shared_ptr<CJacobyTransferConvention> jacobyTransferConvention;
  std::shared_ptr<CBlackwoodConvention> blackwoodConvention;
  std::shared_ptr<CGerberConvention> gerberConvention;
  std::shared_ptr<CCueBidConvention> cueBidConvention;
  std::shared_ptr<CSplinterBidsConvention> splinterBidsConvention;
  std::shared_ptr<CMichaelsCueBidConvention> michaelsCueBidConvention;
  std::shared_ptr<CJacoby2NTConvention> jacoby2NTConvention;
  std::shared_ptr<CUnusualNTConvention> unusualNTConvention;
  std::shared_ptr<CGambling3NTConvention> gambling3NTConvention;
  std::shared_ptr<CDruryConvention> druryConvention;
  std::shared_ptr<COvercallsConvention> overcallsConvention;
  std::shared_ptr<CNegativeDoublesConvention> negativeDoublesConvention;
  std::shared_ptr<CTakeoutDoublesConvention> takeoutDoublesConvention;

  //CNaturalConvention			naturalConvention;
  //CNoTrumpConvention			noTrumpConvention;
  //CFiveCardMajorsConvention	fiveCardMajorsConvention;


  ConventionPool(std::shared_ptr<AppInterface> app);
  ~ConventionPool();
};

#endif // EZ_BIDDING_CONVENTION_POOL_
