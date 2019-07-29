export function marginCenter($node, relativeTo = 'parent') {
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        calcMargin();

        /*
  Prevent occasional initial flicker
*/
        $node.style.visibility = 'visible';
        let resizeTimeout;

        window.onresize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(calcMargin, 100);
        };
    }

    function calcMargin() {
        const nodeWidth = $node.offsetWidth;
        const windowWidth = window.innerWidth;
        const scrollBarWidth = windowWidth - document.documentElement.clientWidth;
        const parentNodeWidth = $node.parentElement.offsetWidth;
        const totalContainerWidth = relativeTo === 'window' ? '100vw' : `${parentNodeWidth + scrollBarWidth}px`;

        if (windowWidth <= (nodeWidth + scrollBarWidth)) {
            $node.style.margin = '';
        } else {
            $node.style.margin = `0 calc((${totalContainerWidth} - ${nodeWidth}px) / 2)`;
        }
    }
}
