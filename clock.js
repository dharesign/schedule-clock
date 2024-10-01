class CanvasClock {
    #canvas;
    #context;
    #digitExtent;
    #digitSize;
    #stroke;
    #handExtent;
    #handWidth;
    #labelExtent;
    #majorTickExtent;
    #minorTickExtent;
    #pinExtent;
    #radius;
    #rotation;
    #scale;
    #segments;
    #tickWidth;

    // @param {Object} options
    //
    // @param {HtmlCanvasElement} options.canvas
    //
    // @param {Number} options.rotation=0
    // Radians. By default 0 degrees is along the x-axis, so this applies a
    // rotation to the clock to allow 0 degrees to be along the y-axis, for
    // example.
    //
    // @param {Number} options.radius=100
    // @param {Number} options.dpi=96
    //
    // @param {String} options.stroke="#444444"
    //
    // @param {TBD} options.segments
    constructor(options) {
        this.#canvas = options.canvas;
        this.#context = this.#canvas.getContext("2d");

        this.#rotation = options.rotation ?? 0;

        const radius = options.radius ?? 100;

        this.#scale = (options.dpi ?? 96) / 96;
        this.#canvas.height = radius * 2 * this.#scale;
        this.#canvas.width  = radius * 2 * this.#scale;
        this.#canvas.style.height = `${radius * 2}px`;
        this.#canvas.style.width  = `${radius * 2}px`;
        this.#radius = radius * this.#scale;

        this.#segments = options.segments ?? [];

        this.#stroke = options.stroke ?? "#444444";

        this.#minorTickExtent = this.#radius * 0.98;
        this.#majorTickExtent = this.#radius * 0.95;
        this.#tickWidth       = this.#radius * 0.005;
        this.#digitExtent     = this.#radius * 0.9;
        this.#digitSize       = this.#radius * 0.05;
        this.#handExtent      = this.#radius * 0.95;
        this.#handWidth       = this.#radius * 0.01;
        this.#labelExtent     = this.#radius * 0.8;
        this.#pinExtent       = this.#radius * 0.02;
    }

    draw() {
        requestAnimationFrame(() => {
            this.#context.reset();

            this.#drawSegments();
            this.#drawTicks();
            this.#drawNumbers();
            this.#drawHands();
        });
    }

    #drawHands() {
        const now = new Date();

        const hoursMs        = now.getHours()   * 60 * 60 * 1000;
        const minutesMs      = now.getMinutes()      * 60 * 1000;
        const secondsMs      = now.getSeconds()           * 1000;
        const millisecondsMs = now.getMilliseconds();

        const hoursAngle        = 2 * Math.PI * ((hoursMs + minutesMs + secondsMs + millisecondsMs) / (24 * 60 * 60 * 1000));
        const minutesAngle      = 2 * Math.PI * ((          minutesMs + secondsMs + millisecondsMs) / (     60 * 60 * 1000));
        const secondsAngle      = 2 * Math.PI * ((                      secondsMs + millisecondsMs) / (          60 * 1000));
        const millisecondsAngle = 2 * Math.PI * ((                                  millisecondsMs) / (               1000));

        const hands = [
            { color: this.#stroke, extent: this.#handExtent * 0.75, width: this.#handWidth * 1,    angle: hoursAngle },
            //{ color: this.#stroke, extent: this.#handExtent * 1,    width: this.#handWidth * 1,    angle: minutesAngle },
            //{ color: "#ff9900", extent: this.#handExtent * 1,    width: this.#handWidth * 0.5,  angle: secondsAngle },
            //{ color: "purple", extent: this.#handExtent * 1,    width: this.#handWidth * 0.25, angle: millisecondsAngle },
        ];

        for (const hand of hands) {
            const startX = this.#radius - Math.cos(hand.angle + this.#rotation) * hand.extent * 0.1;
            const startY = this.#radius - Math.sin(hand.angle + this.#rotation) * hand.extent * 0.1;
            const endX = this.#radius + Math.cos(hand.angle + this.#rotation) * hand.extent;
            const endY = this.#radius + Math.sin(hand.angle + this.#rotation) * hand.extent;

            this.#context.save();
            this.#context.lineCap = "round";
            this.#context.lineWidth = hand.width;
            this.#context.strokeStyle = hand.color;
            this.#context.beginPath();
            this.#context.moveTo(startX, startY);
            this.#context.lineTo(endX, endY);
            this.#context.stroke();
            this.#context.restore();
        }

        this.#context.save();
        this.#context.fillStyle = this.#stroke;
        this.#context.beginPath();
        this.#context.ellipse(this.#radius, this.#radius, this.#pinExtent, this.#pinExtent, 0, 0, 2 * Math.PI);
        this.#context.closePath();
        this.#context.fill();
        this.#context.restore();
    }

    #drawNumbers() {
        const hours = 24;

        for (let hour = 0; hour < hours; ++hour) {
            const angle = 2 * Math.PI * hour / hours;
            const x = this.#radius + Math.cos(angle + this.#rotation) * this.#digitExtent;
            const y = this.#radius + Math.sin(angle + this.#rotation) * this.#digitExtent;

            this.#context.save();
            this.#context.font = `${this.#digitSize}px sans-serif`;
            this.#context.fillStyle = this.#stroke;
            this.#context.textAlign = "center";
            this.#context.textBaseline = "middle";
            this.#context.beginPath();
            this.#context.fillText(hour, x, y);
            this.#context.closePath();
            this.#context.fill();
            this.#context.restore();
        }
    }

    #drawTicks() {
        const majorTicks = 24;  // 24h
        const minorTicks = 4;   // 15m
        const totalTicks = majorTicks * minorTicks;

        for (let tick = 0; tick < totalTicks; ++tick) {
            const major = tick % minorTicks === 0;
            const startExtent = major ? this.#majorTickExtent : this.#minorTickExtent;
            const endExtent = this.#radius - this.#tickWidth;
            const angle = 2 * Math.PI * tick / totalTicks;
            const startX = this.#radius + Math.cos(angle + this.#rotation) * startExtent;
            const startY = this.#radius + Math.sin(angle + this.#rotation) * startExtent;
            const endX = this.#radius + Math.cos(angle + this.#rotation) * endExtent;
            const endY = this.#radius + Math.sin(angle + this.#rotation) * endExtent;

            this.#context.save();
            this.#context.lineCap = "round";
            this.#context.lineWidth = this.#tickWidth;
            this.#context.strokeStyle = this.#stroke;
            this.#context.beginPath();
            this.#context.moveTo(startX, startY);
            this.#context.lineTo(endX, endY);
            this.#context.stroke();
            this.#context.restore();
        }
    }

    #angleForTime(time) {
        const hours   = parseInt(time.split(":")[0], 10);
        const minutes = parseInt(time.split(":")[1], 10);

        const angle = (hours   * 60 * 60 * 1000 +
                       minutes      * 60 * 1000) / (24 * 60 * 60 * 1000);

        return angle;
    }

    #drawSegments() {
        for (const segment of this.#segments) {
            const startAngle = 2 * Math.PI * this.#angleForTime(segment.start);
            const endAngle   = 2 * Math.PI * this.#angleForTime(segment.end);

            this.#context.save();
            this.#context.fillStyle = segment.color;
            this.#context.beginPath();
            this.#context.moveTo(this.#radius, this.#radius);
            this.#context.arc(
                this.#radius,
                this.#radius,
                this.#radius,
                startAngle + this.#rotation,
                endAngle + this.#rotation);
            this.#context.closePath();
            this.#context.fill();
            this.#context.restore();
        }

        for (const segment of this.#segments) {
            const startAngle = 2 * Math.PI * this.#angleForTime(segment.start);
            let endAngle   = 2 * Math.PI * this.#angleForTime(segment.end);
            if (endAngle < startAngle) endAngle = 2 * Math.PI + endAngle;
            const midAngle   = (endAngle + startAngle) / 2;

            const x = this.#radius + Math.cos(midAngle + this.#rotation) * this.#labelExtent;
            const y = this.#radius + Math.sin(midAngle + this.#rotation) * this.#labelExtent;

            this.#context.save();
            this.#context.font = `${this.#digitSize / 2}px sans-serif`;
            this.#context.fillStyle = this.#stroke;
            this.#context.textAlign = "center";
            this.#context.textBaseline = "middle";
            this.#context.beginPath();
            this.#context.fillText(segment.text, x, y);
            this.#context.closePath();
            this.#context.fill();
            this.#context.restore();
        }
    }
}

const canvasClock = new CanvasClock({
    canvas: document.getElementById("clock"),
    radius: 600,
    rotation: -Math.PI / 2,  // 90 degrees anticlockwise
    dpi: 960,

    segments: [
        { start: "07:30", end: "07:40", color: "#ffe9ae", text: "🥱 Wake Up" },
        { start: "07:40", end: "07:55", color: "#fb9ebb", text: "🧦🪥 Get Dressed" },
        { start: "07:55", end: "08:05", color: "#d8eedf", text: "🚲 Go To School" },
        { start: "08:05", end: "14:25", color: "#f9f7ff", text: "🏫 At School" },
        { start: "14:25", end: "14:35", color: "#d8eedf", text: "🚲 Go Home" },
        { start: "14:35", end: "17:30", color: "#fae7eb", text: "🛝 Play" },
        { start: "17:30", end: "18:00", color: "#f0e5d7", text: "🍽️ Eat Dinner" },
        { start: "18:00", end: "18:30", color: "#c0e5e8", text: "🛁 Take A Bath" },
        { start: "18:30", end: "18:35", color: "#fb9ebb", text: "🪥 Clean Teeth" },
        { start: "18:35", end: "19:00", color: "#eae2dd", text: "📚 Read Books" },
        { start: "19:00", end: "07:30", color: "#d0d9e2", text: "🛌 Go To Sleep" },
    ]
});

canvasClock.draw();
// Re-draw every 60s
setInterval(() => canvasClock.draw(), 60 * 1000);
