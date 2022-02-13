import { getFreeIntervals } from '../src/lib/make-schedule'

it('should return free intervals', () => {
	const input = [
		// [-|-xxxxxxxx--------------]
		[
			{ since: new Date('2/1/22 2:00'), till: new Date('2/1/22 10:00') },
		],

		// [-|-xxxxxxxx-------XXXXX--]
		[
			{ since: new Date('2/1/22 2:00'), till: new Date('2/1/22 10:00') },
			{ since: new Date('2/1/22 18:00'), till: new Date('2/1/22 22:00') },
		],

		// [xxxxxx|xx------------XX--]
		[
			{ since: new Date('2/1/22 0:00'), till: new Date('2/1/22 8:00') },
			{ since: new Date('2/1/22 20:00'), till: new Date('2/1/22 22:00') },
		],
	]

	const expected = [
		[
			{ since: new Date('2/1/22 1:00'), till: new Date('2/1/22 2:00') },
			{ since: new Date('2/1/22 10:00'), till: new Date('2/2/22 0:00') },
		],
		[
			{ since: new Date('2/1/22 1:00'), till: new Date('2/1/22 2:00') },
			{ since: new Date('2/1/22 10:00'), till: new Date('2/1/22 18:00') },
			{ since: new Date('2/1/22 22:00'), till: new Date('2/2/22 0:00') },
		],
		[
			{ since: new Date('2/1/22 8:00'), till: new Date('2/1/22 20:00') },
			{ since: new Date('2/1/22 22:00'), till: new Date('2/2/22 0:00') },
		],
	]

	const dates = [
		new Date('2/1/22 1:00'),
		new Date('2/1/22 1:00'),
		new Date('2/1/22 6:00'),
	]

	input.forEach((intervals, index) => {
		const date = dates[index]
		if (!date) throw new Error('dates[index]')

		const freeIntervals = getFreeIntervals(intervals, date)

		const expectedIntervals = expected[index]
		if (!expectedIntervals) throw new Error('expected[index]')

		expect(freeIntervals).toEqual(expectedIntervals)
	})
})