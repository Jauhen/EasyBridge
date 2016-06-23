#ifndef EZ_ENGINE_DEAL_
#define EZ_ENGINE_DEAL_


class Deal {
public:
  Deal();
  ~Deal();

  void SetContract(const int contract) { contract_ = contract; }
  int GetContract() const { return contract_; }
  void SetContractLevel(const int level) { contractLevel_ = level; }
  int GetContractLevel() const { return contractLevel_; }
  void SetContractSuit(const int suit) { contractSuit_ = suit; }
  int GetContractSuit() const { return contractSuit_; }

private:
  int contract_;
  int contractLevel_;
  int contractSuit_;


};

#endif // EZ_ENGINE_DEAL_
