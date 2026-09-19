# Contributing Guidelines

## Code Style

### Python (Backend & ML)
- Follow PEP 8 style guide
- Use 4 spaces for indentation
- Use type hints in function signatures
- Keep lines under 100 characters

Example:
```python
def calculate_risk_score(vitals: List[float]) -> float:
    """Calculate patient risk score from vitals."""
    return sum(vitals) / len(vitals)
```

### JavaScript/React (Frontend)
- Use ES6+ features
- Follow Airbnb JavaScript style guide
- Use meaningful variable names
- Keep components small and focused

### SQL (Database)
- Use UPPERCASE for SQL keywords
- Use meaningful table and column names
- Add comments for complex queries

## Pull Request Process

1. **Create a feature branch** from `develop`
   ```bash
   git checkout -b feature/my-feature develop
   ```

2. **Make your changes**
   - Keep commits focused and atomic
   - Write clear commit messages
   - Add comments for complex logic

3. **Test locally** (from the repo root)
   - Run backend + ML contract tests: `.\.venv\Scripts\python.exe -m pytest backend/tests/ -q`
   - Frontend check: `cd frontend; npm run build` (no unit-test suite yet; the build is the gate)
   - Verify the app runs without errors

4. **Push and create PR**
   ```bash
   git push origin feature/my-feature
   ```

5. **PR Description must include:**
   - What problem does this solve?
   - How does this solve it?
   - Screenshots/videos if UI changes
   - Testing steps for reviewers

## Code Review Checklist

When reviewing PRs, verify:
- [ ] Code follows project style guidelines
- [ ] Changes are well-documented
- [ ] No hardcoded values or secrets
- [ ] Tests are included for new features
- [ ] No breaking changes to APIs
- [ ] Performance implications considered
- [ ] Security best practices followed

## Testing

### Backend Tests
```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests/ -q
```

### Frontend Tests
No unit-test suite yet. The frontend gate is the production build:
```powershell
cd frontend
npm run build
```

### Integration Testing
Run the full system locally and verify:
- Backend health check works
- Data ingestion succeeds
- Frontend displays data correctly
- Risk scores update in real-time

## Reporting Issues

Use GitHub Issues and include:
1. **Title**: Clear, concise description
2. **Description**: Detailed explanation of the problem
3. **Steps to reproduce**: Exact steps that cause the issue
4. **Expected behavior**: What should happen
5. **Actual behavior**: What actually happens
6. **Environment**: OS, Python version, Node version, etc.
7. **Screenshots**: If applicable

Example:
```markdown
**Title**: Backend crashes on missing patient ID

**Description**: 
When sending a vital without patient_id, the backend returns a 500 error instead of 400.

**Steps to Reproduce**:
1. Start backend with `uvicorn backend.app:app --reload`
2. Send POST to /ingest with no patient_id
3. Backend crashes

**Expected**: Return 400 Bad Request with error message

**Actual**: Returns 500 Internal Server Error and crashes
```

## Documentation

- Update README.md for user-facing changes
- Update docstrings for code changes
- Add comments for non-obvious logic
- Update API documentation for endpoint changes
- Add/update architecture diagrams if applicable

## Performance Considerations

- Profile code before optimizing
- Avoid N+1 database queries
- Cache frequently accessed data
- Keep API responses small
- Monitor memory usage in ML models

## Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Sanitize user input
- Use HTTPS in production
- Regular dependency updates: `pip list --outdated`

## Questions?

- Check existing documentation first
- Ask in GitHub Issues for clarification
- Discuss in Pull Request comments
- Contact project maintainers

Thank you for contributing! 🎉
