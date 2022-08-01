export class HourlyTimeWindow {
  from: Date;
  to: Date;

  constructor(dateInput: Date) {
    this.to = new Date(dateInput);
    this.to.setHours(this.to.getHours() + 1, 0, 0, 0);

    const from = new Date(this.to);
    from.setHours(from.getHours() - 1, 0, 0, 0);
    this.from = from;
  }

  addOneHour() {
    this.from.setHours(this.from.getHours() + 1);
    this.to.setHours(this.to.getHours() + 1);
  }
}

export class ExpirationDate {
  date: Date;

  constructor(seconds: number) {
    const now = new Date();
    const expirationDateMS = now.getTime() + Number(seconds) * 1000;
    this.date = new Date(expirationDateMS);
  }
}
