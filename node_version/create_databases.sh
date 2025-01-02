#/bin/sh

./create_db.sh test
sqlite3 test.db < test_settings.sql
./create_db.sh sakev
sqlite3 sakev.db < local_settings.sql
