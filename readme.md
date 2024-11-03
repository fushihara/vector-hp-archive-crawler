2024/12/20
https://internet.watch.impress.co.jp/docs/yajiuma/1609184.html
https://forest.watch.impress.co.jp/docs/serial/yajiuma/1609716.html

大昔はユーザー名部分が連番ではないパターンがあった
ユーザーID不明

こっちは連番。
https://www.vector.co.jp/vpack/browse/person/an001687.html
https://www.vector.co.jp/vpack/browse/person/an063174.html ←これが2024年

# vector側のプロフィールページ
https://www.vector.co.jp/vpack/browse/person/an063174.html
上記のようなURL。ユーザーが存在しない場合はnot foundという文字列が返ってくるが、ステータスコードが200で帰って来るので面倒。

# 閉鎖する個人HPサービス
以下のURLが消える。数字は6桁
https://hp.vector.co.jp/authors/VA039499/

URLに含まれているIDは以下のURLと同じ
https://www.vector.co.jp/vpack/browse/person/an039499.html

開設していないHPは404 not foundが返ってくる。
文字コードは完全にユーザー依存。ShiftでないJISのサイトもあった。

連番の最後は2024/10/22時点では以下の通り
https://hp.vector.co.jp/authors/VA060617/


# 個人HPサービスで連番でないケース
確実な網羅は不可能。
authors部分が連番でないユーザーも、VA～ のURLでもアクセス出来る。
なので連番のみスクレイピングすれば網羅出来るかも？
## yohko
https://hp.vector.co.jp/authors/yohko/
## sengoku
https://hp.vector.co.jp/authors/sengoku/
## tfuruka1
https://hp.vector.co.jp/authors/tfuruka1/  
https://hp.vector.co.jp/authors/VA001687/
https://www.vector.co.jp/vpack/browse/person/an001687.html
## shurei
https://hp.vector.co.jp/authors/shurei/
https://hp.vector.co.jp/authors/VA004149/
https://www.vector.co.jp/vpack/browse/person/an004149.html

# 最終的な一覧
下記全てをマージしたものでいいか

## vectorのHPサイトを連番でスクレイピングしたもの
作者IDが連番でないユーザーは取り逃している
"va_id_list" にidの一覧あり


## vector公式の作者ページを連番でスクレイピングしたもの
全ユーザーの結果があるはず。
ここのHTMLの中に作者ページのリンクを取得出来る
DBの"vector_main_author_pages"に保存

## IAのURL検索結果APIから抽出した結果
これは全部取れているのは確定。
作者IDが連番でないユーザーの情報もここから発見した
DBの"ia_saved_url"に保存済み。ユーザーIDだけのカラムもある

## vector公式の個人HP一覧ページから抽出した結果
"vector公式の個人HP一覧ページ"を参照。
作成するエントリーポイントは"index.204.create-author-list.ts"
記録されているDBは"vector_author_listup"
これはリストアップ完了

# ソース
## vector公式の個人HP一覧ページ
https://hp.vector.co.jp/authors/index.html にアクセスすると↓にリダイレクトされる
http://www.vector.co.jp/vpack/author/listpage.html
以下の2016/10が最後
https://web.archive.org/web/20161012170825/http://www.vector.co.jp/vpack/author/listpage.html

# IAからDLしたURLリスト
## hp.vector
> curl -O "https://web.archive.org/cdx/search/cdx?url=http://hp.vector.co.jp/authors/&matchType=domain&output=json&filter=statuscode:200&collapse=urlkey"

## vector-browse-person
> curl "https://web.archive.org/cdx/search/cdx?url=https://www.vector.co.jp/vpack/browse/person/&matchType=prefix&output=json&filter=statuscode:200&collapse=urlkey" -o "vector-browse-person"

## vector-author-listpage-http.json
> curl "https://web.archive.org/cdx/search/cdx?url=http://www.vector.co.jp/vpack/author/listpage.html&matchType=exact&output=json&filter=statuscode:200" -o "vector-author-listpage-https.json"


# エントリーポイント
## index.100.vpack-browse-persion
vector本家側のプロフィールページを連番でスクレイピングして、HTMLからホームページのURLを表示する
DBの"vector_main_author_pages"に保存

## index.200.hp-vector-authors
vector個人ページのURLを連番でhttp getして、キャッシュに保存する。
DBにキャッシュ以外の保存はしてない
"index.202.create-va-list.ts"が完全な上位互換なので使う事はもう無い

## index.202.create-va-list.ts
vector個人HPページのURLを連番でhttp getして、status codeが200だけだったページのvaのIDをDBに保存。
保存先のDBテーブルは"va_id_list"

## index.203.inport-ia-list-to-db.ts
IAからDLしたvectorの個人HPのURL一覧をDBテーブル"ia_saved_url"に保存
インターネットアクセスは一切なし

## index.204.create-author-list.ts
vector-author-listpage-http.json から作者一覧ページを順番にGETする。
各一覧ページごとに作者ページのidとタイトルの一覧を作る。
DBの保存はまだしてない
DBのテーブルは"vector_author_listup" に追加
