#ifndef EZ_MODEL_FILE_EXPORTER_
#define EZ_MODEL_FILE_EXPORTER_

#include <sstream>
#include <vector>


class FileExporter {
public:
  FileExporter();
  ~FileExporter();

  void SkipLine();
  void WriteLine(const std::string& strValue);
  void WriteLine(int nLineCode, int nValue);
  void WriteLine(int nLineCode, const std::string& strValue);
  void WriteComment(const std::string& strValue);

  std::string GetFileContent() const;

private:
  const std::string FileExporter::GetUppercaseTag(int nLineCode);

  std::ostringstream data_;
};


#endif // EZ_MODEL_FILE_EXPORTER_
