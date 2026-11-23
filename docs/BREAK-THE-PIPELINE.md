# Break the pipeline (on purpose)

A security pipeline is only proven when you see it **catch** something.
Do each experiment on its own branch and open a Pull Request to `main`.
The pipeline should go red, and you take screenshots for your README / LinkedIn.
**Never merge these branches.** Close the PR and delete the branch afterwards.

```bash
git checkout main
git checkout -b demo/1-secret
# make the change, then:
git add . && git commit -m "demo: hardcoded secret" && git push -u origin demo/1-secret
```

---

## 1. Hardcoded secret → caught by gitleaks (stage 1)

In `src/app.js`, add a line with a fake GitHub token: the text `ghp_` followed by
36 random letters and numbers, as one single string, for example
`const token = "ghp_<36 random characters>";`

**Expected:** `1. Secret scan` fails. The finding also shows in **Security → Code scanning**.

> Important: once a secret is pushed it lives in git history forever. For a real secret
> you must **rotate it** (revoke it and create a new one); deleting the line is not enough.

## 2. Code injection with eval → caught by Semgrep (stage 2)

Add this route in `src/app.js` (above the 404 handler):

```js
app.get('/calc', (req, res) => {
  res.send(String(eval(req.query.expr)));
});
```

**Expected:** `2. SAST` fails on the `eval` with user input rule.

## 3. Vulnerable dependency → caught by npm audit (stage 3) and Trivy (stage 4)

```bash
npm install lodash@4.17.15
```

This old lodash version has known HIGH severity CVEs (prototype pollution, command injection).

**Expected:** `3. Unit tests + dependency audit` fails at `npm audit`.

## 4. Old base image → caught by Trivy (stage 4)

In the `Dockerfile`, change both `FROM node:22-alpine` lines to `FROM node:14-alpine`.

**Expected:** `4. Build image + Trivy scan` fails with many HIGH/CRITICAL OS CVEs.

## 5. Missing security headers → caught by OWASP ZAP (stage 5)

In `src/app.js`, delete these two lines:

```js
app.disable('x-powered-by');
app.use(helmet());
```

Also remove the `security headers` test from `test/app.test.js`, or stage 3 will catch it first
(that's also a good result: your unit test caught it).

**Expected:** `5. DAST` fails: CSP header not set, X-Content-Type-Options missing,
anti-clickjacking header missing, X-Powered-By leak. Download the `zap-report` artifact to see the HTML report.
