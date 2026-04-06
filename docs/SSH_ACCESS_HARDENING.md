# SSH Access Hardening Runbook

Use this sequence to provision key-based SSH access and then harden remote SSH.

## 1) Add the public key

Paste your own SSH public key from your local workstation below. You may optionally include a trailing comment to identify the owner, such as an email address or device name.

```bash
echo '<YOUR_PUBLIC_KEY> your-name@laptop' >> ~/.ssh/authorized_keys
```

## 2) Verify key integrity

```bash
wc -l ~/.ssh/authorized_keys
cat ~/.ssh/authorized_keys
```

Expected checks:

- exactly one line,
- no line breaks,
- starts with `ssh-rsa`.

## 3) Validate login from your local workstation

```bash
ssh user@SERVER_IP
```

If it fails:

```bash
ssh -v user@SERVER_IP
```

Look for:

- `Offering public key`
- `Authentication succeeded`

## 4) Harden SSH (only after key auth works)

Edit `/etc/ssh/sshd_config`:

```text
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
```

Validate and restart:

```bash
sudo sshd -t
sudo systemctl restart ssh
```

## 5) Enable firewall

```bash
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

## Failure checklist

If login still fails, verify:

- username (`ubuntu`, `ec2-user`, `root`, etc.),
- server IP,
- SSH port,
- cloud image key injection behavior,
- host or network firewall rules.
