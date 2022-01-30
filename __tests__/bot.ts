function returnSomething() {
	return true
}

it('first test', () => {
	expect(returnSomething()).toBe(true)
})

// TODO: test locales