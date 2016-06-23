#ifndef EZ_BIDDING_CONVENTION_POOL_
#define EZ_BIDDING_CONVENTION_POOL_

#include "app_interface.h"
#include "engine/bidding/4thSuitForcingConvention.h"
#include "engine/bidding/StrongTwoBidsConvention.h"
#include "engine/bidding/WeakTwoBidsConvention.h"
#include "engine/bidding/ShutoutBidsConvention.h"
#include "engine/bidding/Artificial2ClubConvention.h"
#include "engine/bidding/StaymanConvention.h"
#include "engine/bidding/JacobyTransferConvention.h"
#include "engine/bidding/BlackwoodConvention.h"
#include "engine/bidding/GerberConvention.h"
#include "engine/bidding/CueBidConvention.h"
#include "engine/bidding/SplinterBidsConvention.h"
#include "engine/bidding/MichaelsCueBidConvention.h"
#include "engine/bidding/UnusualNTConvention.h"
#include "engine/bidding/Jacoby2NTConvention.h"
#include "engine/bidding/Gambling3NTConvention.h"
#include "engine/bidding/DruryConvention.h"
#include "engine/bidding/NegativeDoublesConvention.h"
#include "engine/bidding/TakeoutDoublesConvention.h"
#include "engine/bidding/OvercallsConvention.h"


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
