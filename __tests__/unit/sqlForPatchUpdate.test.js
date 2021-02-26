const sqlForPatchUpdate = require('../../utils/sqlForPatchUpdate');

describe('sqlForPatchUpdate()', () => {
  test('should generate proper partial update query w/ is_active clause', function () {
    const { query, values } = sqlForPatchUpdate(
      'users',
      { first_name: 'Test' },
      'username',
      'testuser'
    );

    expect(
      /\s+UPDATE users\s+SET first_name=\$1\s+WHERE username=\$2\s+AND is_active = true\s+RETURNING \*\s+/.test(
        query
      )
    ).toBeTruthy();
    expect(values).toEqual(['Test', 'testuser']);
  });

  test('should generate proper partial update query', function () {
    const { query, values } = sqlForPatchUpdate(
      'distributors',
      { first_name: 'Test' },
      'username',
      'testuser'
    );
    expect(
      /\s+UPDATE distributors\s+SET first_name=\$1\s+WHERE username=\$2\s+RETURNING \*\s+/.test(
        query
      )
    ).toBeTruthy();

    expect(values).toEqual(['Test', 'testuser']);
  });
});
