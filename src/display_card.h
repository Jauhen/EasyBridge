#ifndef EZ_DISPLAY_CARD_H_
#define EZ_DISPLAY_CARD_H_

#include "afx.h"
#include <string>
#include "engine/card/card.h"

//namespace easy_bridge {

// file constants
extern const TCHAR cSuit[];
extern const TCHAR cCard[];
extern const TCHAR cFaceCard[];
extern const LPCTSTR szFaceValueName[];

class CDeck;


class DisplayCard {

  friend class CDeck;

  // public functions
public:
  easybridge::engine::Card* GetCard() { return card_; }

  // one-time only init operation
  void Initialize(int nSuit, int nValue, CBitmap* pBitmap, CDC* pDC);
  void SetBitmap(CBitmap* pBitmap, CDC* pDC);
  //
  void Clear();
  void ClearBackground();
  BOOL IsValid() const;

  // GetName() -- "D7"
  LPCTSTR GetName()  const { 
    return m_strName;
  }
  // GetFullName() -- "7 of Diamonds"
  LPCTSTR GetFullName()  const { return m_strFullName; }
  // GetReverseFullName() -- "Diamond 7"
  LPCTSTR GetReverseFullName()  const { return m_strReverseFullName; }
  // GetFaceName() -- "seven"
  LPCTSTR GetFaceName()  const { return m_strFaceName; }
  // GetCardLetter() -- "7"
  TCHAR GetCardLetter() const;
  // GetSuitLetter() -- "D"
  TCHAR GetSuitLetter() const;

  //
  void GetRect(RECT& rect) const;
  void Draw(CDC *pDC);
  void DrawHighlighted(CDC* pDC, BOOL bVisible);
  void FlashCard(CDC* pDC, int numTimes = 2);
  void RestoreBackground(CDC* pDC);
  void MoveTo(CDC *pDC, int destX, int destY, BOOL bRedraw = TRUE);
  void DragTo(CDC* pDC, int destX, int destY);
  void Animate(CDC* pDC, int destx, int desty, BOOL bClearAtEnd = FALSE, int nGranularity = -99);
  int GetDisplayValue() const;
  int GetDummyDisplayValue() const;

  // overloaded operators
  BOOL operator>(DisplayCard& compareCard) { return (card_ > compareCard.card_) ? TRUE : FALSE; }
  BOOL operator<(DisplayCard& compareCard) { return (card_ < compareCard.card_) ? TRUE : FALSE; }
  BOOL operator==(DisplayCard& compareCard) { return (card_ == compareCard.card_) ? TRUE : FALSE; }
  BOOL operator>=(DisplayCard& compareCard) { return (card_ >= compareCard.card_) ? TRUE : FALSE; }
  BOOL operator<=(DisplayCard& compareCard) { return (card_ <= compareCard.card_) ? TRUE : FALSE; }
  BOOL operator>(int nFaceValue) { VERIFY(nFaceValue <= ACE); return (card_->GetFaceValue() > easybridge::engine::CardValue(nFaceValue)) ? TRUE : FALSE; }
  BOOL operator<(int nFaceValue) { VERIFY(nFaceValue <= ACE); return (card_->GetFaceValue() < easybridge::engine::CardValue(nFaceValue)) ? TRUE : FALSE; }
  BOOL operator==(int nFaceValue) { VERIFY(nFaceValue <= ACE); return (card_->GetFaceValue() == easybridge::engine::CardValue(nFaceValue)) ? TRUE : FALSE; }
  BOOL operator>=(int nFaceValue) { VERIFY(nFaceValue <= ACE); return (card_->GetFaceValue() >= easybridge::engine::CardValue(nFaceValue)) ? TRUE : FALSE; }
  BOOL operator<=(int nFaceValue) { VERIFY(nFaceValue <= ACE); return (card_->GetFaceValue() <= easybridge::engine::CardValue(nFaceValue)) ? TRUE : FALSE; }
  int operator+(int nVal) { return (*card_ + easybridge::engine::CardValue(nVal)); }
  int operator-(int nVal) { return (*card_ - easybridge::engine::CardValue(nVal)); }
  int operator+(DisplayCard& card) { return (*card_ + *(card.GetCard())); }
  int operator-(DisplayCard& card) { return (*card_ - *(card.GetCard())); }

  // inline functions
  int GetFaceValue() const { easybridge::engine::CardValue v = card_->GetFaceValue(); return static_cast<int>(v); }
  int GetDeckValue() const { return card_->GetDeckValue(); }
  int GetSortedDeckIndex() const { return card_->GetSortedDeckIndex(); }
  int GetDisplayPosition() const { return m_nDisplayPosition; }
  void SetDisplayPosition(int nPos) { ASSERT(nPos >= 0); m_nDisplayPosition = nPos; }
  void DecrementDisplayPosition() { ASSERT(m_nDisplayPosition > 0); m_nDisplayPosition--; }
  int GetSuitPosition() const { return m_nSuitPosition; }
  void SetSuitPosition(int nPos) { ASSERT(nPos >= 0); m_nSuitPosition = nPos; }
  void DecrementSuitPosition() { ASSERT(m_nSuitPosition > 0); m_nSuitPosition--; }
  int GetXPosition() const { return m_nPosX; }
  int GetYPosition() const { return m_nPosY; }
  void SetXPosition(int nPos = -1) { m_nPosX = nPos; }
  void SetYPosition(int nPos = -1) { m_nPosY = nPos; }
  int GetSuit() const { easybridge::engine::Suit s = card_->GetSuit(); return static_cast<int>(s); }
  int GetOwner() const { return card_->GetOwner(); }
  void SetOwner(int nPlayer);
  int GetHandIndex() const { return m_nHandIndex; }
  void SetHandIndex(int nIndex) { m_nHandIndex = nIndex; }
  void DecrementHandIndex() { m_nHandIndex--; }
  BOOL IsCardAssigned() const { return card_->IsCardAssigned() ? TRUE : FALSE; }
  void SetAssigned(BOOL bAssign = TRUE) { card_->SetAssigned(bAssign == TRUE); }
  void ClearAssignment() { card_->ClearAssignment(); }
  BOOL IsCardFaceUp() const { 
    return card_->IsCardFaceUp() ? TRUE : FALSE; 
  }
  void SetFaceUp(BOOL bFaceUp = TRUE) { 
    card_->SetFaceUp(bFaceUp == TRUE); 
  }
  void SetFaceDown() { 
    card_->SetFaceDown(); 
  }

  // data
private:
  CString	m_strName, m_strFaceName, m_strFullName, m_strReverseFullName;
  int 	m_nPosX, m_nPosY;
  int		m_nHandIndex;
  int		m_nDisplayPosition;
  int		m_nSuitPosition;
  CBitmap *m_pBitmap;
  CBitmap m_prevBitmap, m_hlPrevBitmap;
  BOOL	m_bBackgroundSet, m_bHLBackgroundSet;
  //
  static int  m_nCardWidth;
  static int	m_nCardHeight;

  // routines
private:
  DisplayCard();
  ~DisplayCard();

private:
  void operator=(DisplayCard* pSource);
  void operator=(DisplayCard& cSource);

  easybridge::engine::Card*  card_;
};

//} // namespace easy_bridge
#endif // !EZ_DISPLAY_CARD_H_
