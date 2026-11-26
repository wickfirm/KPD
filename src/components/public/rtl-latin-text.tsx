/// Arabic pages show a field's English until it is translated, and keep some
/// for good: addresses, brand lines, a number with a unit. Inside a
/// right-to-left paragraph an English line puts its full stop on its left, and
/// a bare number is split into groups that read right to left.
///
/// This marks every element whose text holds no Arabic letter: a Latin one as
/// data-text="latin", a number on its own as data-text="digits". Two rules at
/// the end of public/locales/rtl.css then let the first follow its own first
/// letter and the second read left to right, each keeping the place the
/// mirrored layout gives it. An element with Arabic anywhere in it is left
/// alone, so an Arabic sentence that starts with a Latin name stays as it is.
///
/// It runs while the page is parsed, before first paint, and again for what
/// React adds later (a pop-up, a soft navigation). The root layout renders it
/// on Arabic pages only: English and Japanese pages never run it.
const MARK_LATIN_TEXT = `(function(){var d=document,arabic=/[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/,latin=/[A-Za-z\\u00C0-\\u024F]/,digit=/[0-9]/;
function walk(el){var own="",n=el.firstChild,has,kids=0;
for(;n;n=n.nextSibling)if(n.nodeType===3)own+=n.nodeValue;
has=arabic.test(own);
for(n=el.firstElementChild;n;n=n.nextElementSibling){kids++;if(walk(n))has=true;}
if(has||!own.trim()||/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(el.tagName))return has;
if(latin.test(own))el.setAttribute("data-text","latin");
else if(!kids&&digit.test(own))el.setAttribute("data-text","digits");
return false;}
function start(){walk(d.body);var queued=0,added=[];
new MutationObserver(function(changes){for(var i=0;i<changes.length;i++){var nodes=changes[i].addedNodes;for(var j=0;j<nodes.length;j++)if(nodes[j].nodeType===1)added.push(nodes[j]);}
if(queued||!added.length)return;queued=requestAnimationFrame(function(){queued=0;var list=added;added=[];for(var k=0;k<list.length;k++)walk(list[k]);});}).observe(d.body,{childList:true,subtree:true});}
if(d.body)start();else d.addEventListener("DOMContentLoaded",start);})();`;

export function RtlLatinText() {
  return <script dangerouslySetInnerHTML={{ __html: MARK_LATIN_TEXT }} />;
}
