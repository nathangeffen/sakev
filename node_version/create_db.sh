#/bin/sh

rm "$1"*
sqlite3 $1 < init_db.sql

