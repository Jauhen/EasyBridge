#include <algorithm>
#include "model/file_exporter.h"

using namespace std;

//
// PBN File Format codes
//
std::vector<std::string> tszTagName = {
  "",			// 0
  "Event",
  "Site",
  "Date",
  "Round",
  "Board",
  "West",
  "North",
  "East",
  "South",
  "Dealer",		// 10
  "Vulnerable",
  "Deal",
  "Scoring",
  "Declarer",
  "Contract",		// 15
  "Result",
  "", "", "",
  "Auction",			// 20
  "", "", "", "",
  "Play",				// 25
  "", "", "", "",
  "Note",				// 30
  "Description",
  "Generator",
  "", "",
  "", "", "", "",
  "*",				// 39
};


FileExporter::FileExporter() {}

FileExporter::~FileExporter() {}

void FileExporter::SkipLine() {
  data_ << endl;
}

void FileExporter::WriteLine(const string& strValue) {
  data_ << strValue << endl;
}

void FileExporter::WriteLine(int nLineCode, int nValue) {
  data_ << "[" << GetUppercaseTag(nLineCode) << " \"" << nValue << "\"]" << endl;
}

void FileExporter::WriteLine(int nLineCode, const string& strValue) {
  data_ << "[" << GetUppercaseTag(nLineCode) << " \"" << strValue << "\"]" << endl;
}

void FileExporter::WriteComment(const std::string& strValue) {
  data_ << "%% " << strValue << endl;
}

const string FileExporter::GetUppercaseTag(int nLineCode) {
  if ((nLineCode < 0) || (nLineCode > tszTagName.size())) {
    return string {};
  }

  string strTag = tszTagName[nLineCode];
  transform(strTag.begin(), strTag.end(), strTag.begin(), ::toupper);
  return strTag;
}

string FileExporter::GetFileContent() const {
  return data_.str();
}