// Setup canvas
var canvas = document.getElementById('canvas');
canvas.width = window.innerWidth*2;
canvas.height = window.innerHeight*2;
var c = canvas.getContext('2d');

var nodes = [];
var nodeIndex = 0;
var connectors = [];
var ctrlDown = false;
var connecting = false;

// Set initial scroll position to center
var scrollX = (canvas.width - window.innerWidth) / 2;
var scrollY = (canvas.height - window.innerHeight) / 2;
window.scrollTo(scrollX, scrollY);
window.onbeforeunload = function () {
    window.scrollTo(scrollX, scrollY);
}

jQuery(document).ready(function($){
    // Click in empty space
    $("canvas").click(function(event) {
        createNode(event.pageX, event.pageY);
    });

    // Move mouse in empty space
    $(this).mousemove(function(event) {
        mouseX = event.pageX;
        mouseY = event.pageY;
        draw(event.pageX, event.pageY);
    });

    // Mouseup in empty space
    $("canvas").mouseup(function(event) {
        if (connecting) {
            connectors.pop();
            draw();
            connecting = false;
        }
    });

    // Handle keyboard input
    $(this).keydown(function(event) {
        const keyName = event.key;

        if (keyName === 'Control') {
            ctrlDown = true;
            
            // Make it so that you can't drag any nodes around
            nodes.forEach(function(item) {
                item.draggable("disable");
            });
        }

        if (event.ctrlKey) {
            // change text style
            if (keyName === 'b') {
                var textbox = getActiveTextbox();
                if (textbox.css("font-weight") == "400") {
                    textbox.css("font-weight", "bold");
                } else {
                    textbox.css("font-weight", "normal");
                }
            } else if (keyName === 'i') {
                var textbox = getActiveTextbox();
                if (textbox.css("font-style") == "normal") {
                    textbox.css("font-style", "italic");
                } else {
                    textbox.css("font-style", "normal");
                }
            // change text size
            } else if (keyName === 'ArrowUp') {
                var textbox = getActiveTextbox();
                var newSize = parseInt(textbox.css("font-size").split("p")[0]) + 2;
                textbox.css("font-size", newSize + "px");
            } else if (keyName === 'ArrowDown') {
                var textbox = getActiveTextbox();
                var newSize = parseInt(textbox.css("font-size").split("p")[0]) - 2;
                textbox.css("font-size", newSize + "px");
            // change textbox width
            } else if (keyName === 'ArrowLeft') {
                var index = getActiveIndex();
                var node = nodes[index];
                var textbox = $('#text' + node[0].id);
                node.css("width", (parseInt(node.css("width").slice(0, -2)) - 5) + "px");
            } else if (keyName === 'ArrowRight') {
                var index = getActiveIndex();
                var node = nodes[index];
                var textbox = $('#text' + node[0].id);
                node.css("width", (parseInt(node.css("width").slice(0, -2)) + 5) + "px");
            }
            event.preventDefault();
        }

        // Delete node and all attached connectors
        if (keyName === 'Delete') {
            var index = getActiveIndex();
            var node = nodes[index];
            deleteConnectors(node[0]);
            node.remove();
            nodes.splice(index, 1);
        }
    });

    $(this).keyup(function(event) {
        if (event.key === 'Control') {
            ctrlDown = false;
            if (connecting) {
                connectors.pop();
                draw();
            }
            connecting = false

            // Make it so that you can drag any nodes around again
            nodes.forEach(function(item) {
                item.draggable("enable");
            });
        }
    });
});

function createNode(xpos, ypos) {
    var new_offset = {top:ypos, left:xpos};
    var new_width = 100;

    nodes.push($('<div><textarea id="text' + nodeIndex + '" spellcheck="false"></textarea></div>')
        .width(new_width)
        .draggable({
            cancel: "text",
            start: function() {
                $('#text' + this.id).focus();
            },
            drag: function() {
                if (!ctrlDown) {
                    updateConnectors(this);
                    draw(null, null, true);
                }
            },
            stop: function() {
                $('#text' + this.id).focus();
            }
        })
        .resizable()
        .css({
            'position'	        : 'absolute',
            'background-color'  : 'yellow',
            'border-color'      : 'black',
            'border-width'      : '1px',
            'border-style'	    : 'solid',
            'resizable'         : 'both'
        })
        .offset(new_offset)
        .attr("id", nodeIndex)
        .appendTo('body'));

    newNode = $('#' + nodeIndex);
    // Focus textbox on click
    newNode.click(function() {
        $('#text' + this.id).focus();
    });

    // Listener that creates connector on mousedown
    newNode.mousedown(function(event) {
        if (ctrlDown) {
            var startX = getCenterOfTextbox(this)[0];
            var startY = getCenterOfTextbox(this)[1];
            connecting = true;
            connectors.push(new Connector(startX, startY, this.id));
        }
    });

    // Listener that finishes connector on mouseup
    newNode.mouseup(function(event) {
        if (connecting) {
            if (this !== $('#' + connectors[connectors.length-1].id1)[0]){
                var endX = getCenterOfTextbox(this)[0];
                var endY = getCenterOfTextbox(this)[1];
                connectors[connectors.length-1].connect(endX, endY, this.id);
                draw();
            } else {
                connectors.pop();
            }
        }
        connecting = false;
    });

    // Make textbox auto-expandable
    newNode.height((parseInt($('#text' + nodeIndex).css("font-size").slice(0, -2)) + 2) * 2);
    $('textarea').each(function () {
        this.setAttribute('style', 'height:'+(this.scrollHeight)+'px;overflow-y:hidden;');
    }).on('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        $('#' + this.id.substring(4)).css('height', this.style.height);
    });

    nodeIndex += 1;
}

function updateConnectors(node) {
    connectors.forEach(function(item) {
        if (item.id1 == node.id) {
            item.startX = getCenterOfTextbox(node)[0];
            item.startY = getCenterOfTextbox(node)[1];
        } else if (item.id2 == node.id) {
            item.endX = getCenterOfTextbox(node)[0];
            item.endY = getCenterOfTextbox(node)[1];
        }
    });
}

function deleteConnectors(node) {
    var indicesToDelete = []
    connectors.forEach(function(item, index) {
        if (item.id1 == node.id || item.id2 == node.id) {
            indicesToDelete.push(index);
        }
    });
    indicesToDelete.forEach(function(indexToDelete) {
        delete connectors[indexToDelete];
    })
    connectors = connectors.filter(function(value) {
        return value !== undefined;
    })
    draw(null, null, true);
}

function draw(mouseX, mouseY, forceDrawing) {
    if (connecting || forceDrawing) {
        c.clearRect(0, 0, canvas.width, canvas.height);
        connectors.forEach(function(item) {
            item.draw(c, mouseX, mouseY);
        });
    }
}

function getCenterOfTextbox(node) {
    var xpos = parseInt(node.style.left.slice(0,-2)) + node.style.width.slice(0,-2) / 2;
    var ypos = parseInt(node.style.top.slice(0,-2)) + node.style.height.slice(0,-2) / 2;
    return [xpos, ypos];
}

function getActiveTextbox() {
    var value;
    nodes.forEach(function(item) {
        var textbox = $('#text' + item[0].id);
        if (textbox.is(":focus")) {
            value = textbox;
        }
    });
    return value;
}

function getActiveIndex() {
    var value;
    nodes.forEach(function(item, index) {
        var id = item[0].id;
        var textbox = $('#text' + id);
        if (textbox.is(":focus")) {
            value = index;
        }
    });
    return value;
}