class Connector {
    constructor(startX, startY, id1) {
        this.startX = startX;
        this.startY = startY;
        this.id1 = id1;
    }

    draw(c, currentX, currentY) {
        c.beginPath();
        c.moveTo(this.startX, this.startY);
        if (this.endX === undefined) {
            c.lineTo(currentX, currentY);
        } else {
            c.lineTo(this.endX, this.endY);
        }
        c.stroke();
    }

    connect(endX, endY, id2) {
        this.endX = endX;
        this.endY = endY;
        this.id2 = id2;
    }
}