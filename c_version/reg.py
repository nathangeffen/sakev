"""
Test regular expressions
"""

import re

p = re.compile("(.*)/(.*)/(.*)/(.*)")

m = p.match("12_34_")

print(m)
