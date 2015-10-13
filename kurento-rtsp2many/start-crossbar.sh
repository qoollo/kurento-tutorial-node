echo "Crossbar router running here."
echo "Press Ctrl+C to close it."

crossbar start --config config.json --logtofile

echo "Crossbar router stopped."
rm -f .crossbar/*.pid

echo "Press <Enter> to exit."
read