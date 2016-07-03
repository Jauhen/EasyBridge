#ifndef EZ_CARD_CONTANTS_
#define EZ_CARD_CONTANTS_

// basic alias
typedef int BID;
typedef CArray<int, int> CIntArray;
typedef CList<int, int> CIntList;
typedef CMap<int, int, int, int> CIntMap;

// limits
const int MAX_CARDBACKS = 32;
//const int MAXHOLDING	= 13;
const int MAXHOLDING = 26;

// commonly used values
const int NONE = -1;

// card suits
enum Suit { ANY = -1, CLUBS = 0, DIAMONDS = 1, HEARTS = 2, SPADES = 3, NOTRUMP = 4 };

// majors vs. minors selection
const int SUITS_ANY = 0;
const int SUITS_MINORS = 1;
const int SUITS_MAJORS = 2;

// honor card values
const int TEN = 10;
const int JACK = 11;
const int QUEEN = 12;
const int KING = 13;
const int ACE = 14;

// positions
enum Position { UNKNOWN = -1, ANY_POS = -1, SOUTH = 0, WEST = 1, NORTH = 2, EAST = 3, TABLE = 4, };

// teams
enum Team { NEITHER = -1, NORTH_SOUTH = 0, EAST_WEST = 1, BOTH = 2 };

// bids
enum Bids {
  BID_NONE = -1,
  BID_PASS = 0,
  BID_1C = 1, BID_1D = 2, BID_1H = 3, BID_1S = 4, BID_1NT = 5,
  BID_2C = 6, BID_2D = 7, BID_2H = 8, BID_2S = 9, BID_2NT = 10,
  BID_3C = 11, BID_3D = 12, BID_3H = 13, BID_3S = 14, BID_3NT = 15,
  BID_4C = 16, BID_4D = 17, BID_4H = 18, BID_4S = 19, BID_4NT = 20,
  BID_5C = 21, BID_5D = 22, BID_5H = 23, BID_5S = 24, BID_5NT = 25,
  BID_6C = 26, BID_6D = 27, BID_6H = 28, BID_6S = 29, BID_6NT = 30,
  BID_7C = 31, BID_7D = 32, BID_7H = 33, BID_7S = 34, BID_7NT = 35,
  BID_DOUBLE = 36, BID_REDOUBLE = 37
};

#define	CARDSUIT(x)		 (x / 13)
#define	FACEVAL(x)		 (x % 13) + 2
#define	MAKEDECKVALUE(x,y)	((x*13) + (y - 2))
#define	DECKVALUE(x)		((x->GetSuit()*13) + (x->GetFaceValue() - 2))

#define ISMAJOR(x)	(((x == HEARTS) || (x == SPADES))? TRUE: FALSE)
#define ISMINOR(x)	(((x == CLUBS) || (x == DIAMONDS))? TRUE: FALSE)
#define ISNOTRUMP(x)((x == NOTRUMP)? TRUE: FALSE)

#define BID_SUIT(x)  ( ((x <= BID_PASS) || (x >= BID_DOUBLE))? -1 : ((x-1) % 5) )
#define BID_LEVEL(x) ( ((x <= BID_PASS) || (x >= BID_DOUBLE))? -1 : (((x-1) / 5) + 1) )
#define MAKEBID(s,l) (BID_PASS + (l-1)*5 + s + 1)

#define ISBID(x) ((x >= BID_1C) && (x <= BID_7NT))
#define ISSUIT(x) ((x >= CLUBS) && (x <= SPADES))
#define ISCARD(x) ((x >= 0) && (x <= 51))
#define ISDECKVAL(x) ((x >= 0) && (x <= 51))
#define ISFACEVAL(x) ((x >= 2) && (x <= ACE))
#define ISPOSITION(x) ((x >= SOUTH) && (x <= EAST))
#define ISPLAYER(x) ((x >= SOUTH) && (x <= EAST))
#define ISTEAM(x) ((x == NORTH_SOUTH) || (x == EAST_WEST))

//
#define OTHER_MAJOR(x) 	((x == HEARTS)? SPADES:HEARTS)
#define OTHER_MINOR(x) 	((x == CLUBS)? DIAMONDS:CLUBS)


#endif // EZ_CARD_CONTANTS_
