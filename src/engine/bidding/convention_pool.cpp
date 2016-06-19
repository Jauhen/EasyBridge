#include "stdafx.h"
#include "convention_pool.h"


ConventionPool::ConventionPool(std::shared_ptr<AppInterface> app) {
  strongTwoBidsConvention = std::make_shared<CStrongTwoBidsConvention>(app);
  weakTwoBidsConvention = std::make_shared<CWeakTwoBidsConvention>(app);
  shutoutBidsConvention = std::make_shared<CShutoutBidsConvention>(app);
  artificial2ClubConvention = std::make_shared<CArtificial2ClubConvention>(app);
  fourthSuitForcingConvention = std::make_shared<C4thSuitForcingConvention>(app);
  staymanConvention = std::make_shared<CStaymanConvention>(app);
  jacobyTransferConvention = std::make_shared<CJacobyTransferConvention>(app);
  blackwoodConvention = std::make_shared<CBlackwoodConvention>(app);
  gerberConvention = std::make_shared<CGerberConvention>(app);
  cueBidConvention = std::make_shared<CCueBidConvention>(app);
  splinterBidsConvention = std::make_shared<CSplinterBidsConvention>(app);
  michaelsCueBidConvention = std::make_shared<CMichaelsCueBidConvention>(app);
  jacoby2NTConvention = std::make_shared<CJacoby2NTConvention>(app);
  unusualNTConvention = std::make_shared<CUnusualNTConvention>(app);
  gambling3NTConvention = std::make_shared<CGambling3NTConvention>(app);
  druryConvention = std::make_shared<CDruryConvention>(app);
  overcallsConvention = std::make_shared<COvercallsConvention>(app);
  negativeDoublesConvention = std::make_shared<CNegativeDoublesConvention>(app);
  takeoutDoublesConvention = std::make_shared<CTakeoutDoublesConvention>(app);
}


ConventionPool::~ConventionPool() {
}
