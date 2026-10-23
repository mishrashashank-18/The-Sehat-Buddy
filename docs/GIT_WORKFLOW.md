# Safe Git Collaboration Workflow

This workflow is designed for two developers working simultaneously on **The Sehat Buddy** using separate machines and Google Antigravity. It completely eliminates merge conflicts on `main`, prevents code overwrites, and ensures every change is tested and preserved.

---

## 1. Branch Architecture

| Branch | Purpose | Permissions / Rules |
| :--- | :--- | :--- |
| `main` | Production & deployment-ready stable code | **Protected**: No direct commits or pushes. Merged only from `development` via tested Pull Request. |
| `development` | Shared team integration branch | Merged via Pull Requests from feature branches after code review. |
| `feature/shashank-work` | Developer 1 (Shashank) working branch | Pushed only by Developer 1. |
| `feature/friend-work` | Developer 2 (Friend) working branch | Pushed only by Developer 2. |

---

## 2. Daily Workflow Guide

### For Developer 1 (Shashank)

#### A. Starting a Work Session
```bash
# 1. Verify clean working directory
git status

# 2. Fetch all updates from GitHub without altering local files
git fetch origin

# 3. Switch to your feature branch (create if not already existing)
git checkout feature/shashank-work 2>/dev/null || git checkout -b feature/shashank-work

# 4. Integrate latest approved development changes into your branch
git merge origin/development
```

#### B. Making & Committing Changes
Make focused changes in small steps.
```bash
# Check modified files
git status
git diff

# Stage specific files (avoid 'git add .' if untracked experiment files exist)
git add src/path/to/Component.jsx backend/path/to/route.js

# Commit with a clear, descriptive message
git commit -m "feat(module): describe exact change"
```

#### C. Pushing & Opening a Pull Request
```bash
# Push your feature branch to GitHub
git push -u origin feature/shashank-work
```
- Open GitHub in your browser: `https://github.com/mishrashashank-18/The-Sehat-Buddy/pulls`
- Click **New Pull Request**
  - **Base branch:** `development`
  - **Compare branch:** `feature/shashank-work`
- Add a summary of what was added or fixed and tag your teammate for review.

---

### For Developer 2 (Friend)

#### A. Starting a Work Session
```bash
# 1. Verify clean working directory
git status

# 2. Fetch all updates from GitHub
git fetch origin

# 3. Switch to your feature branch (create if not already existing)
git checkout feature/friend-work 2>/dev/null || git checkout -b feature/friend-work

# 4. Integrate latest approved development changes into your branch
git merge origin/development
```

#### B. Making & Committing Changes
```bash
# Check modified files
git status
git diff

# Stage specific files
git add src/path/to/Component.jsx

# Commit with a clear message
git commit -m "feat(module): describe exact change"
```

#### C. Pushing & Opening a Pull Request
```bash
# Push your feature branch to GitHub
git push -u origin feature/friend-work
```
- Open GitHub: `https://github.com/mishrashashank-18/The-Sehat-Buddy/pulls`
- Click **New Pull Request**
  - **Base branch:** `development`
  - **Compare branch:** `feature/friend-work`
- Request review from Developer 1.

---

## 3. Resolving Conflicts Safely (Without Overwriting Code)

If a Pull Request or merge shows a conflict:

1. **Never use `--force` or `--hard` reset.**
2. On your machine, fetch and merge `development` into your feature branch:
   ```bash
   git fetch origin
   git checkout feature/your-branch
   git merge origin/development
   ```
3. Git will mark conflicting lines between `<<<<<<< HEAD`, `=======`, and `>>>>>>> origin/development`.
4. Open the conflicting files in your editor:
   - Carefully review **both** code snippets.
   - Combine both developers' functional logic.
   - Delete conflict marker lines (`<<<<<<<`, `=======`, `>>>>>>>`).
5. Run tests or build verification:
   ```bash
   npm run build
   ```
6. Stage and commit the resolved files:
   ```bash
   git add <resolved-files>
   git commit -m "fix(merge): resolve conflicts between feature branch and development"
   git push origin feature/your-branch
   ```

---

## 4. Promoting Tested Changes to `main`

Once features in `development` have been verified together and tested:
1. Open a Pull Request from `development` into `main`.
2. Both developers review and confirm.
3. Merge the PR on GitHub.
4. Locally update `main`:
   ```bash
   git checkout main
   git pull origin main
   ```

---

## 5. Absolute Safety Invariants

- **NEVER** run `git push origin main --force` or `git push --force`.
- **NEVER** run `git reset --hard` on shared commits.
- **NEVER** commit `.env` files or API secrets.
- Always run `npm run build` locally before pushing.
- Always make a zip or folder copy of your repository directory before starting large merges.
