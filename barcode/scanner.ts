/**
 * Created by STYRLab1 on 7/20/2017.
 */

class scanner {
    private Image: any;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;


    constructor(imageSrc: String) {
        this.Image = new Image();
        this.Image.src = imageSrc;
    }

    public draw() {

        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.canvas.width = this.Image.width;
        this.canvas.height = this.Image.height;
        this.ctx = this.canvas.getContext('2d');

        this.ctx.drawImage(this.Image, 0, 0, this.Image.width, this.Image.height,
            0, 0, this.canvas.width, this.canvas.height);

        this.Image.style.display = 'none';

        /*
         * Loads a scaled image to fit the canvas without streching.
         * We find the ratio needed by manipulating the width/height.
         */

        document.getElementById('fileInput').addEventListener('change', () => this.imageLoader(), false);

        let scanImage2 = document.getElementById('scanImage2');
        scanImage2.addEventListener('click', () => this.barcodeScanner2());
        let scanImage = document.getElementById('scanImage');
        scanImage.addEventListener('click', () => this.barcodeScanner());
        let invertColor = document.getElementById('invertColor');
        invertColor.addEventListener('click', () => this.invert());
        let generateImage = document.getElementById('generate');
        generateImage.addEventListener('click', () => this.generateImage())
        let scan = document.getElementById('scan');
        scan.addEventListener('click', () => this.scan());
    }

    private generateImage() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let img = new ImageGenerator("1234ABCD1234ABCD1234ABCD", 1000).exportImage();
        img.onload = () => {
            let ct = document.getElementById('measure');
            ct.appendChild(img);
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            ct.removeChild(img);
            this.ctx.drawImage(img, 0, 0);
        };
    }

    private imageLoader() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let reader = new FileReader();
        reader.onload = () => {
            let img = new Image();
            img.onload = () => {
                let ct = document.getElementById('measure');
                ct.appendChild(img);
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                ct.removeChild(img);
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
    }

    private barcodeScanner2() {
        let scanWidth = this.canvas.width / 3;
        let scanHeight = this.canvas.height / 4;
        console.log(this.findFirstBluePixel(scanWidth, scanHeight));
    };

    private scan() {

        let topCorner: IPoint = {
            x: 1685,
            y: 1168
        };
        let sideCorner: IPoint  = {
            x: 1613,
            y: 2229
        };
        let bottomCorner: IPoint  = {
            x: 1481,
            y: 3001
        };

        let heightCalcTriangleWidth = topCorner.x - sideCorner.x;

        let heightCalcTriangleHeight = sideCorner.y - topCorner.y;

        let rotateAngle = Math.atan(heightCalcTriangleHeight / heightCalcTriangleWidth);

        this.ctx.translate(topCorner.x, topCorner.y);
        this.ctx.rotate(rotateAngle);
        this.ctx.fillRect(0, 0, 1000, 100);

        let distance = (Math.sqrt(Math.pow((sideCorner.x - topCorner.x), 2) + Math.pow((sideCorner.y - topCorner.y), 2)));
        console.log("height: ", distance);

        let topCornerRotated: IPoint = {
            x: 0,
            y: 0
        };

        let sideCornerRotated: IPoint  = {
            x: 0,
            y: distance
        };

        let distance2 = (Math.sqrt(Math.pow((sideCorner.x - bottomCorner.x), 2) + Math.pow((sideCorner.y - bottomCorner.y), 2)));
        console.log("width: ", distance2);

        let bottomCornerRotated: IPoint  = {
            x: distance,
            y: distance2
        };

        let Proportions = new ProportionUtil(topCornerRotated, bottomCornerRotated, sideCornerRotated);
        let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        let data = imageData.data;
        let pixel, rgba;
        let bitStorage = [];

        let dataPoints = Proportions.getDataPoints();

        for(let i = 0; i < dataPoints.length; i++) {
            pixel = this.ctx.getImageData(dataPoints[i].x, dataPoints[i].y, 1, 1);
            console.log(dataPoints[i].x, dataPoints[i].y);
            this.ctx.fillStyle = "FF00FF";
            data = pixel.data;
            rgba = 'rgba(' + data[0] + ', ' + data[1] +
                ', ' + data[2] + ', ' + (data[3] / 255) + ')';
            console.log(rgba);

            if (data[0] + data[1] + data[2] == 765) {
                bitStorage.push(1);
            } else if (data[0] + data[1] + data[2] == 420) {
                bitStorage.push(0);
            }
            this.ctx.fillRect(dataPoints[i].x, dataPoints[i].y, 10, 10);
        }
    }

    /*
     * Scans pixel by pixel in a line and adds corresponding 1's and
     * 0's into the bitStorage array depending on the color it sees
     */
    private barcodeScanner() {
        let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        let data = imageData.data;
        let pixel, rgba;
        let bitStorage = [];
        for (let x = 0; x < this.canvas.width; x++) {
            pixel = this.ctx.getImageData(x, 25, 1, 1); //sx, sy, sw, sh
            data = pixel.data;
            rgba = 'rgba(' + data[0] + ', ' + data[1] +
                ', ' + data[2] + ', ' + (data[3] / 255) + ')';
            if (data[1] + data[2] == 510)
                bitStorage.push(1);
            else
                bitStorage.push(0);
        }
        let count = 0;
        let barcode = [];

        /*
         * Reads 50 integers of bitStorage at a time and determines if
         * it translates to a 1 or 0. We do this by taking the avg.
         */

        let total;
        let bit;
        for (let j = 0; j < bitStorage.length / 50; j++) {
            total = 0;
            for (let k = 0; k < 50; k++) {
                total += bitStorage[count++];
            }
            bit = Math.round(total / 50);
            barcode.push(bit);
        }
        console.log(barcode);
    }

    /*
     * Inverts the colors of the barcode given barcode.
     * Used to see if the barcode value changes.
     */
    private invert() {
        let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        let data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i]; // red
            data[i + 1] = 255 - data[i + 1]; // green
            data[i + 2] = 255 - data[i + 2]; // blue
        }
        this.ctx.putImageData(imageData, 0, 0);
    }

    private findFirstBluePixel(scanWidth: number, scanHeight: number): Array<IPoint> {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < scanHeight; j++) {
                let scanX = Math.round(scanWidth / 4 * (3 - i) + scanWidth);
                let scanY = j;
                // this.ctx.fillStyle = "red";
                // this.ctx.fillRect(Math.round(scanWidth / 4) * (3 - i) + scanWidth, j, 1, 1);
                if (this.isBlue(scanX, scanY)) {
                    console.log(this.isBlue(904, 66));
                    console.log("Success");
                    console.log("First blue pixel: ", scanX, " ", scanY);

                    //find top corner of first blue square
                    let firstCoord = this.findTopSquareCorner(scanX, scanY, []);
                    let secondCoord = this.findRightSquareCorner(scanX, scanY, []);

                    //calculated bluesquare width based of the two corners found of first blue square
                    let blueSquareWidth = Math.sqrt((Math.pow(firstCoord.x - secondCoord.x, 2)) + Math.pow(firstCoord.y - secondCoord.y, 2));
                    // calculated corners of blue squares 2 and 3 we need to check and verify the actual corners with findBluePixelEstimated method
                    let topLeftDist = (blueSquareWidth * 45) / 4;
                    let topBottomDist = (blueSquareWidth * 38) / 4;
                    //convert to to current coordinate orientation
                    let topLeftDistConverted = Math.sin((Math.PI / 180) * 45) * topLeftDist;
                    //find and verify location of a pixel on the blue square edge of blue square 2 based on calculated starting point
                    let coord = this.findBluePixelEstimated(topLeftDistConverted, scanWidth);
                    //the verified corner of second blue square
                    let secondCorner = this.findLeftSquareCorner(coord.x, coord.y);
                    let thirdCorner = this.findBottomCorner(this.findBottomBluePixel(this.canvas.width/3, this.canvas.height/6));
                    console.log(firstCoord, secondCorner, thirdCorner);
                    return ([firstCoord, secondCorner, thirdCorner]);
                }
            }
        }
    }

    private isBlue(i: number, j: number) {
        let pixel = this.ctx.getImageData(i, j, 1, 1);
        let data = pixel.data;
        return data[0] < 160 && data[1] < 160 && data[2] > 200;
    }

    private findTopSquareCorner(x: number, y: number, squareCoords: Array<IPoint>): IPoint {
        // this.ctx.fillStyle = "red";
        // this.ctx.fillRect(x, y, 1, 1);
        let coord: IPoint = {x: x, y: y};
        if (this.isBlue(x + 1, y)) {
            //we know we are on the left side
            squareCoords.push(coord);
            return this.findTopSquareCorner(x + 1, y - 1, squareCoords);
        } else if (this.isBlue(x - 1, y)) {
            //we know we are on right side
            squareCoords.push(coord);
            return this.findTopSquareCorner(x - 1, y - 1, squareCoords);
        } else {
            return (coord);
        }
    }

    private findRightSquareCorner(x: number, y: number, squareCoords: Array<IPoint>): IPoint {
        squareCoords = [];
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(x, y, 1, 1);
        let coord: IPoint = {x: x, y: y};
        //Might need to increase search area as pixels around square edges tend to be lighter blue
        if (this.isBlue(x + 1, y + 1)) {
            //we know we are on the left side
            return this.findRightSquareCorner(x + 1, y + 1, squareCoords);
        } else {
            //we are at top of square
            return (coord)

        }
    }

    private findBluePixelEstimated(y, scanWidth: number) {
        let coord: IPoint = {x: 0, y: 0};
        for (let j = 0; j < scanWidth / 2; j++) {
            let scanX = j;
            let scanY = y;

            if (this.isBlue(scanX, scanY)) {
                coord.x = scanX;
                coord.y = scanY;
                return coord;
            }
        }
        for (let j = 0; j < scanWidth / 2; j++) {
            let scanX = j;
            let scanY = y + 50;
            if (this.isBlue(scanX, scanY)) {
                coord.x = scanX;
                coord.y = scanY;
                return coord;
            }
        }
        for (let j = 0; j < scanWidth / 2; j++) {
            let scanX = j;
            let scanY = y - 50;
            if (this.isBlue(scanX, scanY)) {
                coord.x = scanX;
                coord.y = scanY;
                return coord;
            }
        }
    }

    private findLeftSquareCorner(x: number, y: number,): IPoint {
        let coord: IPoint = {x: x, y: y};
        //Might need to increase search area as pixels around square edges tend to be lighter blue
        if (this.isBlue(x - 1, y + 1)) {
            //we know we are on the UPPER left side
            return this.findLeftSquareCorner(x - 1, y + 1);
        } else if (this.isBlue(x - 1, y - 1)) {
            return this.findLeftSquareCorner(x - 1, y - 1);
        } else {
            //we are on leftSquare corner
            return (coord)

        }
    }

    private findBottomBluePixel(x: number, scanHeight: number) {
        let coord: IPoint = {x: 0, y: 0};
        for (let j = this.canvas.height; j > this.canvas.height - scanHeight; j--) {
            let scanX = x + x/4;
            let scanY = j;

            if (this.isBlue(scanX, scanY)) {
                coord.x = scanX;
                coord.y = scanY;
                return coord;
            }
        }
        for (let j = this.canvas.height; j > this.canvas.height - scanHeight; j--) {
            let scanX = x + x/2;
            let scanY = j;
            if (this.isBlue(scanX, scanY)) {
                coord.x = scanX;
                coord.y = scanY;
                return coord;
            }
        }
        for (let j = this.canvas.height; j > this.canvas.height - scanHeight; j--) {
            let scanX = x + x/3;
            let scanY = j;
            if (this.isBlue(scanX, scanY)) {
                coord.x = scanX;
                coord.y = scanY;
                return coord;
            }
        }
    }

    private findBottomCorner(coord: IPoint): IPoint{
        if (this.isBlue(coord.x + 1, coord.y + 1)) {
            coord.x = coord.x  + 1;
            coord.y = coord.y + 1;
            //we know we are on the left side
            return this.findBottomCorner(coord);
        } else if (this.isBlue(coord.x - 1, coord.y + 1)) {
            coord.x = coord.x - 1;
            coord.y = coord.y + 1;
            //we are on right side
            return this.findBottomCorner(coord);
        } else {
            //we are on bottom corner
            return (coord)

        }
    }

}

new scanner('barcode.png').draw();