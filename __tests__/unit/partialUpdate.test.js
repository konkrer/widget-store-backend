const sqlForPartialUpdate = require('../../helpers/partialUpdate');

describe('partialUpdate()', () => {
  test('should generate proper partial update query w/ is_active clause', function () {
    const { query, values } = sqlForPartialUpdate(
      'users',
      { first_name: 'Test' },
      'username',
      'testuser'
    );

    expect(query).toEqual(
      'UPDATE users SET first_name=$1 WHERE username=$2 AND is_active = true RETURNING *'
    );
    expect(values).toEqual(['Test', 'testuser']);
  });

  test('should generate proper partial update query', function () {
    const { query, values } = sqlForPartialUpdate(
      'distributors',
      { first_name: 'Test' },
      'username',
      'testuser'
    );
    expect(query).toEqual(
      'UPDATE distributors SET first_name=$1 WHERE username=$2 RETURNING *'
    );

    expect(values).toEqual(['Test', 'testuser']);
  });
});
