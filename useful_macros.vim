
" Convert stupid awards from "* Foo" to "<li>Foo</li>"
/^* ��,��.a�kb �khch$<li>

" Wrap <li> blocks with <ul> for stupid awards
/[^>]\n  \<li<ul>}�ku�kbÊ/u�kb�kb�kbÊ/u�kb�kb�kb</ul>

" Sort <ul> blocks for stupid awards
/\<ul�kdgl

" Convert "1. Foo" to "<li>Foo</li>"
�khdlech$<li>k

" Wrap paragraphs with <p> tags
ch}<p>kk

" Convert stupid awards from "\n    Foo" to "  <li>Foo</li>"
/^\n    [^<]dd<<�khch$<li>

" Convert stupid awards from "    Foo" to "  <li>Foo</li>"
/^    ��,��.a�kb �khch$<li><<
