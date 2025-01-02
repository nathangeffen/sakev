#/bin/sh

rm "$1".db*
sqlite3 $1.db < init_db.sql

