#include <string>
#include <iostream>
const char *getStdStringData(std::string *_data)
{
  const char *p = _data->data();
  return p;
}

int main()
{
    using namespace std::literals;

    // 从 const char* 创建 string
    std::string str1 = "hello";

    // 从字符串字面量创建 string
    auto str2 = "world"s;
    const char *p = str1.c_str();

    // 拼接 string
    std::string str3 = str1 + " " + str2;

    // 打印结果
    std::cout << str3 << '\n';

    std::string::size_type pos = str3.find(" ");
    str1 = str3.substr(pos + 1); // 空格后的部分
    str2 = str3.substr(0, pos);  // 空格前的部分

    std::cout << str1 << ' ' << str2 << '\n';

    // 用下标运算符 operator[] 访问元素
    std::cout << str1[0] << '\n';
    str1[0] = 'W';
    std::cout << str1 << '\n';
}