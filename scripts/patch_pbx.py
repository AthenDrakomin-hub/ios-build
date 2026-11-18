#!/usr/bin/env python3
"""
给 Capacitor 生成的 Xcode 工程打补丁：

1) 统一 PRODUCT_BUNDLE_IDENTIFIER（命令行 bundle id 可能与 config 不同）
2) 在 App target 的 buildSettings 里补 DEVELOPMENT_TEAM /
   PROVISIONING_PROFILE_SPECIFIER / CODE_SIGN_STYLE / CODE_SIGN_IDENTITY

为什么不直接在 xcodebuild 命令行传签名参数：
  那些参数会作用到所有 target，包括 Pods 里的动态库 target，
  它们不支持描述文件，会直接报 "does not support provisioning profiles"。
"""
import os
import re
import pathlib
import sys

PBX = pathlib.Path("ios/App/App.xcodeproj/project.pbxproj")


def main() -> int:
    bundle = os.environ["BUNDLE_ID"]
    team = os.environ["TEAM_ID"]
    profile = os.environ["PROFILE_NAME"]

    if not PBX.exists():
        print(f"找不到 {PBX}", file=sys.stderr)
        return 1

    text = PBX.read_text()

    # 1) bundle id 统一
    text = re.sub(r"PRODUCT_BUNDLE_IDENTIFIER = [^;]+;",
                  f"PRODUCT_BUNDLE_IDENTIFIER = {bundle};", text)

    # 2) 追加签名设置（每处 bundle id 后面）
    needle = f"PRODUCT_BUNDLE_IDENTIFIER = {bundle};"
    replacement = (
        f"PRODUCT_BUNDLE_IDENTIFIER = {bundle};\n"
        f"\t\t\t\tDEVELOPMENT_TEAM = {team};\n"
        f'\t\t\t\tPROVISIONING_PROFILE_SPECIFIER = "{profile}";\n'
        f"\t\t\t\tCODE_SIGN_STYLE = Manual;\n"
        f'\t\t\t\tCODE_SIGN_IDENTITY = "iPhone Distribution";'
    )
    text = text.replace(needle, replacement)

    PBX.write_text(text)

    print("bundle id 命中:", text.count(needle))
    print("team 命中:", text.count(f"DEVELOPMENT_TEAM = {team}"))
    print("profile 命中:", text.count("PROVISIONING_PROFILE_SPECIFIER"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
