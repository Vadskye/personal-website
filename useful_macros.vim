
" Convert stupid awards from "* Foo" to "<li>Foo</li>"
/^* ��,��.

" Wrap <li> blocks with <ul> for stupid awards
/[^>]\n  \<li

" Sort <ul> blocks for stupid awards
/\<ul

" Convert "1. Foo" to "<li>Foo</li>"
�khdlech$<li>k

" Wrap paragraphs with <p> tags
ch}<p>kk

" Convert stupid awards from "\n    Foo" to "  <li>Foo</li>"
/^\n    [^<]

" Convert stupid awards from "    Foo" to "  <li>Foo</li>"
/^    ��,��.