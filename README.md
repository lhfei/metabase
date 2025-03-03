# Data-Link

fork 自[Metabase](https://github.com/metabase/metabase/tree/master)

## 启动

1. 本地启动 MySQL
2. yarn
3. yarn dev
4. 项目会启动在`http://localhost:3000`

## 汉化

1. 运行时的汉化文件位于`/resources/frontend_client/app/locales`
2. 如果该文件夹不存在或丢失或发生变更，根目录下执行`clojure -X:build:build/i18n`，重新构建。
3. 构建执行的是`bin/build/src/i18n/create_artifacts/frontend.clj`这个脚本，作用是将 locales 下的所有.po 文件编译成.json 放到 `resources/frontend_client/app/locales` 下面
