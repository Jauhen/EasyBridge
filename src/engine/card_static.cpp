#include "stdafx.h"
#include "engine/card.h"
#include "card_constants.h"

//
int CCard::CharToSuit(TCHAR c) {
  int i;
  //
  for (i = 0; i < 5; i++)
    if ((c == cSuit[i]) || (toupper(c) == cSuit[i]))
      break;
  if (i < 5)
    return i;
  else
    return -1;
}


//
int CCard::CharToFaceValue(TCHAR c) {
  int nValue = 0;
  //
  char t = c;
  if (islower(c))
    t = toupper(c);
  //
  if (isdigit(c)) {
    nValue = c - '0';
  } else {
    switch (c) {
      case 'T':
        nValue = TEN;
        break;
      case 'J':
        nValue = JACK;
        break;
      case 'Q':
        nValue = QUEEN;
        break;
      case 'K':
        nValue = KING;
        break;
      case 'A':
        nValue = ACE;
        break;
    }
  }
  //
  return nValue;
}


//
TCHAR CCard::GetSuitLetter(int i) {
  if ((i < CLUBS) || (i > SPADES))
    return ' ';
  else
    return cSuit[i];
}

//
TCHAR CCard::GetCardLetter(int i) {
  if ((i < 2) || (i > ACE))
    return '?';
  else
    return cCard[i];
}

//
LPCTSTR CCard::GetSuitName(int nSuit) {
  VERIFY(ISSUIT(nSuit));
  return szSuitName[nSuit];
}

//
LPCTSTR CCard::GetCardName(int nFaceValue) {
  VERIFY(ISFACEVAL(nFaceValue));
  return szFaceValueName[nFaceValue];
}


//
LPCTSTR CCard::CardValToString(int i) {
  if (!ISFACEVAL(i))
    return "???";
  else
    return szCardName[i];
}


//
// CardToString()
// 
// eg., Queen of Hearts
//
const CString CCard::CardToString(int i) {
  CString strLabel;
  if (!ISCARD(i))
    strLabel = "???";
  else
    strLabel.Format("%s of %s", szCardName[FACEVAL(i)], szSuitName[CARDSUIT(i)]);
  return strLabel;
}



//
// CardToShortString()
//
// e.g., HQ
//
const CString CCard::CardToShortString(int i) {
  CString strLabel;
  if (!ISCARD(i))
    strLabel = "??";
  else
    strLabel.Format("%c%c", cSuit[CARDSUIT(i)], cCard[FACEVAL(i)]);
  return strLabel;
}


//
// CardToReverseString()
//
// e.g., Heart Queen
//
const CString CCard::CardToReverseString(int i) {
  CString strLabel;
  if (!ISCARD(i))
    strLabel = "???";
  else
    strLabel.Format("%s %s", SuitToSingularString(CARDSUIT(i)), szCardName[FACEVAL(i)]);
  return strLabel;
}

//
LPCTSTR CCard::SuitToString(int nSuit) {
  if ((nSuit < CLUBS) || (nSuit > NOTRUMP))
    return "????";
  else
    return szSuitName[nSuit];
}


//
// same as above, but truncate ending 's'
//
LPCTSTR CCard::SuitToSingularString(int nSuit) {
  if ((nSuit < CLUBS) || (nSuit > NOTRUMP))
    return "????";
  else
    return szSuitNameSingular[nSuit];
}
