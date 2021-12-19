class Point {
    protected _x = 0;
    protected _y = 0;

    protected _type = 'pt';

    constructor(x: number, y: number) {
        this._x = x || 0;
        this._y = y || 0;
    }

    get x(): number {
        return this._x;
    }

    set x(value: string | number) {
        if (!isNaN(value as any)) {
            this._x = parseFloat(value as any);
        }
    }

    get y(): number {
        return this._y;
    }

    set y(value: number | string) {
        if (!isNaN(value as any)) {
            this._y = parseFloat(value as any);
        }
    }

    get type(): string {
        return this._type;
    }

    set type(value: any) {
        this._type = value.toString();
    }
}

class Rectangle extends Point {
    protected _w = 0;
    protected _h = 0;

    constructor(x: number, y: number, w: number, h: number) {
        super(x, y);
        this.type = 'rect';
        this.w = w;
        this.h = h;
    }

    get w(): number {
        return this._w;
    }

    set w(value: number | string) {
        if (!isNaN(value as any)) {
            this._w = parseFloat(value as any);
        }
    }

    get h(): number {
        return this._h;
    }

    set h(value: number | string) {

        if (!isNaN(value as any)) {
            this._h = parseFloat(value as any);
        }
    }
}

/**
 * A matrix object for 2D homogenous transformations: <br>
 * | a b 0 | <br>
 * | c d 0 | <br>
 * | e f 1 | <br>
 * pdf multiplies matrices righthand: v' = v x m1 x m2 x ...
 *
 */
export class Matrix {
    protected matrix: number[] = [];

    precision!: number;

    constructor(
        sx: number,
        shy: number,
        shx: number,
        sy: number,
        tx: number,
        ty: number
    ) {
        this.sx = !isNaN(sx) ? sx : 1;
        this.shy = !isNaN(shy) ? shy : 0;
        this.shx = !isNaN(shx) ? shx : 0;
        this.sy = !isNaN(sy) ? sy : 1;
        this.tx = !isNaN(tx) ? tx : 0;
        this.ty = !isNaN(ty) ? ty : 0;
    }

    get sx(): number {
        return this.matrix[0];
    }

    set sx(value: number) {
        this.matrix[0] = value;
    }

    get shy(): number {
        return this.matrix[1];
    }

    set shy(value: number) {
        this.matrix[1] = value;
    }

    get shx(): number {
        return this.matrix[2];
    }

    set shx(value: number) {
        this.matrix[2] = value;
    }

    get sy(): number {
        return this.matrix[3];
    }

    set sy(value: number) {
        this.matrix[3] = value;
    }

    get tx(): number {
        return this.matrix[4];
    }

    set tx(value: number) {
        this.matrix[4] = value;
    }

    get ty(): number {
        return this.matrix[5];
    }

    set ty(value: number) {
        this.matrix[5] = value;
    }

    get a(): number {
        return this.matrix[0];
    }

    set a(value) {
        this.matrix[0] = value;
    }

    get b(): number {
        return this.matrix[1];
    }

    set b(value: number) {
        this.matrix[1] = value;
    }

    get c(): number {
        return this.matrix[2];
    }

    set c(value) {
        this.matrix[2] = value;
    }

    get d(): number {
        return this.matrix[3];
    }

    set d(value: number) {
        this.matrix[3] = value;
    }

    get e(): number {
        return this.matrix[4];
    }

    set e(value: number) {
        this.matrix[4] = value;
    }

    get f(): number {
        return this.matrix[5];
    }

    set f(value: number) {
        this.matrix[5] = value;
    }

    get rotation(): number {
        return Math.atan2(this.shx, this.sx);
    }

    get scaleX(): number {
        return this.decompose().scale.sx;
    }

    get scaleY(): number {
        return this.decompose().scale.sy;
    }

    get isIdentity(): boolean {
        if (this.sx !== 1) {
            return false;
        }
        if (this.shy !== 0) {
            return false;
        }
        if (this.shx !== 0) {
            return false;
        }
        if (this.sy !== 1) {
            return false;
        }
        if (this.tx !== 0) {
            return false;
        }
        if (this.ty !== 0) {
            return false;
        }

        return true;
    }

    join(parm1: string): string {
        return ([this.sx, this.shy, this.shx, this.sy, this.tx, this.ty]).join(parm1);
    }

    multiply(matrix: Matrix): Matrix {
        const sx = matrix.sx * this.sx + matrix.shy * this.shx;
        const shy = matrix.sx * this.shy + matrix.shy * this.sy;
        const shx = matrix.shx * this.sx + matrix.sy * this.shx;
        const sy = matrix.shx * this.shy + matrix.sy * this.sy;
        const tx = matrix.tx * this.sx + matrix.ty * this.shx + this.tx;
        const ty = matrix.tx * this.shy + matrix.ty * this.sy + this.ty;

        return new Matrix(sx, shy, shx, sy, tx, ty);
    }

    decompose(): { scale: Matrix, translate: Matrix, rotate: Matrix, skew: Matrix } {
        let a = this.sx;
        let b = this.shy;
        let c = this.shx;
        let d = this.sy;
        const e = this.tx;
        const f = this.ty;

        let scaleX = Math.sqrt(a * a + b * b);

        a /= scaleX;
        b /= scaleX;

        let shear = a * c + b * d;

        c -= a * shear;
        d -= b * shear;

        const scaleY = Math.sqrt(c * c + d * d);

        c /= scaleY;
        d /= scaleY;
        shear /= scaleY;

        if (a * d < b * c) {
            a = -a;
            b = -b;
            shear = -shear;
            scaleX = -scaleX;
        }

        return {
            scale: new Matrix(scaleX, 0, 0, scaleY, 0, 0),
            translate: new Matrix(1, 0, 0, 1, e, f),
            rotate: new Matrix(a, b, -b, a, 0, 0),
            skew: new Matrix(1, 0, shear, 1, 0, 0)
        };
    }

    reverse(): Matrix {
        const det = this.a * this.d - this.b * this.c;
        if (!det) {
            return new Matrix(1, 0, 0, 1, 0, 0);
        }
        return new Matrix(
            this.a / det,
            -this.b / det,
            -this.c / det,
            this.d / det,
            (this.b * this.f - this.d * this.e) / det,
            (this.c * this.e - this.a * this.f) / det
        );
    }

    toString(parmPrecision: number): string {
        return [this.sx, this.shy, this.shx, this.sy, this.tx, this.ty].join(' ');
    }

    inversed(): Matrix {
        const a = this.sx;
        const b = this.shy;
        const c = this.shx;
        const d = this.sy;
        const e = this.tx;
        const f = this.ty;

        const quot = 1 / (a * d - b * c);
        const aInv = d * quot;
        const bInv = -b * quot;
        const cInv = -c * quot;
        const dInv = a * quot;
        const eInv = -aInv * e - cInv * f;
        const fInv = -bInv * e - dInv * f;

        return new Matrix(aInv, bInv, cInv, dInv, eInv, fInv);
    }

    applyToPoint(pt: Point): Point {
        const x = pt.x * this.sx + pt.y * this.shx + this.tx;
        const y = pt.x * this.shy + pt.y * this.sy + this.ty;

        return new Point(x, y);
    }

    applyToRectangle(rect: Rectangle): Rectangle {
        const pt1 = this.applyToPoint(new Point(rect.x, rect.y));
        const pt2 = this.applyToPoint(new Point(rect.x + rect.w, rect.y + rect.h));
        return new Rectangle(pt1.x, pt1.y, pt2.x - pt1.x, pt2.y - pt1.y);
    }

    clone(): Matrix {
        const sx = this.sx;
        const shy = this.shy;
        const shx = this.shx;
        const sy = this.sy;
        const tx = this.tx;
        const ty = this.ty;

        return new Matrix(sx, shy, shx, sy, tx, ty);
    }
}
