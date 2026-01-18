export class ScoreSystem {
  private distance = 0; // in "meters" (scaled)
  private airtime = 0; // seconds
  private trickPoints = 0;
  private crashed = false;

  reset() {
    this.distance = 0;
    this.airtime = 0;
    this.trickPoints = 0;
    this.crashed = false;
  }

  setCrashed(v: boolean) {
    this.crashed = v;
  }

  addDistance(pxDelta: number) {
    if (this.crashed) return;
    // Convert pixels to a friendly distance scale
    this.distance += Math.max(0, pxDelta) * 0.02;
  }

  addAirtime(dtSeconds: number) {
    if (this.crashed) return;
    this.airtime += dtSeconds;
  }

  addTrickPoints(points: number) {
    if (this.crashed) return;
    this.trickPoints += Math.max(0, Math.floor(points));
  }

  getScore(): number {
    // distance is the main score; airtime and tricks add bonuses
    const distanceScore = this.distance * 10;
    const airtimeScore = this.airtime * 50;
    return Math.floor(distanceScore + airtimeScore + this.trickPoints);
  }

  getDistanceMeters(): number {
    return Math.floor(this.distance);
  }

  getAirtimeSeconds(): number {
    return Math.round(this.airtime * 10) / 10;
  }

  getTrickPoints(): number {
    return this.trickPoints;
  }
}
