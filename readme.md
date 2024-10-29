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

https://hp.vector.co.jp/authors/yohko/

https://hp.vector.co.jp/authors/tfuruka1/  
https://hp.vector.co.jp/authors/VA001687/
https://www.vector.co.jp/vpack/browse/person/an001687.html

https://hp.vector.co.jp/authors/shurei/
https://hp.vector.co.jp/authors/VA004149/
https://www.vector.co.jp/vpack/browse/person/an004149.html

# エントリーポイント
## index.202.create-va-list.ts
テーブル va_id_list に、vaのID一覧を作る。

## index.203.inport-ia-list-to-db.ts
IAからdlしたURL一覧をDBにインポート
