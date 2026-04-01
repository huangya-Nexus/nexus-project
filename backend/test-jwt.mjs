import jwt from 'jsonwebtoken'

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyODhiYzc0Zi03MGUxLTRkOWUtYjBkZS0yZjZlNmNhNTYyNmQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTc3NDkyMjgzOCwiZXhwIjoxNzc1NTI3NjM4fQ.rYYAkhH6-ac8wCRlPyADj0sqCTjXiyX8hKKTj7JbMMA'

try {
  const decoded = jwt.decode(token)
  console.log('Decoded JWT:', decoded)
} catch (e) {
  console.error('Error:', e)
}
