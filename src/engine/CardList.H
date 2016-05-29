//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CCardList
//
// base class -- a collection of cards
//
#ifndef __CARDLIST__
#define __CARDLIST__


class DisplayCard;
class CPlayer;

//
class CCardList {

// public routines
public:
	virtual void Init();
	virtual void Clear();
	//
	virtual void Add(DisplayCard* pCard, const BOOL bSort=FALSE);
	virtual void Merge(const CCardList& srcList);
	virtual void operator<<(DisplayCard* pCard) { Add(pCard); }
	virtual void operator<<(const CCardList& srcList) { Merge(srcList); }
	virtual DisplayCard* RemoveByIndex(const int nIndex);	// the main routine
	virtual DisplayCard* RemoveByValue(const int nDeckValue);
	virtual void Remove(const DisplayCard* pCard);
	virtual void Sort();
	virtual void ReverseSortOrder(const BOOL bReverse=TRUE) { m_bReverseSort = bReverse; }
	virtual void FormatHoldingsString();
	//
	virtual DisplayCard* FindCard(const int nSuit, const int nFaceValue) const;
	virtual DisplayCard* FindCardByDeckValue(const int nDeckValue) const;
	virtual DisplayCard* FindCardByFaceValue(const int nFaceValue) const;
	virtual BOOL HasCard(const DisplayCard* pCard) const;
	virtual BOOL HasCard(const int nDeckValue) const;
	virtual BOOL HasCardOfFaceValue(const int nFaceValue) const;
	virtual BOOL ContainsCards(const CCardList& cards) const;
	virtual BOOL ContainsAtLeastOneOf(const CCardList& cCards) const;
	virtual BOOL RangeCovers(const int nFaceValue) const;
	virtual BOOL RangeCovers(const DisplayCard* pCard) const;
	virtual int GetCardIndex(const int nDeckValue) const;
	virtual int GetCardIndex(const DisplayCard* pCard) const;
	virtual void SetCard(int nIndex, DisplayCard* pCard);
	virtual int GetNumCardsAbove(const int nFaceValue) const;
	virtual int GetNumCardsBelow(const int nFaceValue) const;
	virtual int GetNumCardsAbove(const DisplayCard* pCard) const;
	virtual int GetNumCardsBelow(const DisplayCard* pCard) const;
	virtual int GetAllCardsAbove(const int nFaceValue, CCardList& cards) const;
	virtual int GetAllCardsBelow(const int nFaceValue, CCardList& cards) const;
	virtual int GetAllCardsAbove(const DisplayCard* pCard, CCardList& cards) const;
	virtual int GetAllCardsBelow(const DisplayCard* pCard, CCardList& cards) const;
	virtual DisplayCard* GetLowestCardAbove(const int nFaceValue) const;
	virtual DisplayCard* GetHighestCardBelow(const int nFaceValue) const;
	virtual DisplayCard* GetLowestCardAbove(const DisplayCard* pCard) const;
	virtual DisplayCard* GetHighestCardBelow(const DisplayCard* pCard) const;
	virtual int	   GetEquivalentCards(DisplayCard* pCard, CCardList& cardList, const BOOL bIncludeCard=FALSE);
	virtual BOOL   AreEquivalentCards(DisplayCard* pCard1, DisplayCard* pCard2);
	virtual DisplayCard* GetHighestEquivalentCard(DisplayCard* pCard);
	virtual DisplayCard* GetLowestEquivalentCard(DisplayCard* pCard);

	//
	BOOL   operator==(const CCardList& srcList) const;
	BOOL   operator!=(const CCardList& srcList) const;
	//
	DisplayCard* operator[](int nIndex) const;
	DisplayCard* GetAt(int nIndex) const;
	DisplayCard* GetTopCard() const;
	DisplayCard* GetBottomCard() const;
	DisplayCard* GetSecondHighestCard() const;
	DisplayCard* GetSecondLowestCard() const;
	int GetTopCardVal() const;
	int GetBottomCardVal() const;
	int GetNumCards() const { return m_numCards; }
	BOOL IsEmpty() { return (m_numCards == 0); }
	BOOL IsSorted() const { return m_bSorted; }
	void EnableAutoSort(BOOL bMode) { m_bAutoSort = bMode; }
	LPCTSTR GetHoldingsString() const { return m_strHoldings; }
	CString GetHoldingsCommaDelimited() const;

// protected routines
protected:
	virtual void TurnCardsFaceUp(const BOOL bCode);


// public data
public:

// private data
protected:
	DisplayCard* m_cards[MAXHOLDING];
	int	m_numCards;
	int	m_bSorted;
	int	m_bAutoSort;
	BOOL m_bReverseSort;
	CString m_strHoldings;

// construction/destruction
public:
	CCardList();
	CCardList(const CCardList& srcList);
	~CCardList();
};

#endif