# Source this before invoking sdkmanager / gradle:
#   source /home/z/my-project/scripts/android-env.sh
export ANDROID_HOME=/home/z/my-project/android-sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export GRADLE_USER_HOME=/home/z/my-project/tools/gradle-user-home

# System OpenJDK 21 is present; AGP 8.11 supports it.
if [ -d "/home/z/my-project/tools/jdk" ]; then
  export JAVA_HOME=/home/z/my-project/tools/jdk
elif command -v java >/dev/null 2>&1; then
  export JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")"
fi

export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$JAVA_HOME/bin:/home/z/my-project/tools/gradle-8.13/bin:$PATH"
