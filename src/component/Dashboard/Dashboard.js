import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { MdDeleteOutline } from 'react-icons/md';
import { GrAdd } from 'react-icons/gr';
import { TiTick } from 'react-icons/ti';
import { v4 as uuidv4 } from 'uuid';

const Dashboard = () => {
  const [lists, setLists] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/lists`)
      .then(response => response.json())
      .then(data => setLists(data))
      .catch(error => console.error('Error fetching lists:', error));
  }, []);

  const handleAddList = () => {
    const newList = {
      items: [],
    };

    fetch(`${process.env.REACT_APP_API_URL}/api/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newList),
    })
      .then(response => response.json())
      .then(data => setLists(prevLists => [...prevLists, data]))
      .catch(error => console.error('Error creating list:', error));
  };

  const handleAddListItem = async (listId) => {
    const userInput = window.prompt('Enter the content for the new item:');
    if (!userInput) {
      return;
    }

    const newItem = {
      id: uuidv4(),
      content: userInput,
      showTick: false,
    };

    const updatedLists = lists.map(list => {
      if (list._id === listId) {
        return {
          ...list,
          items: [...list.items, newItem],
        };
      }
      return list;
    });

    setLists(updatedLists);

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/lists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLists.find(list => list._id === listId)),
      });
    } catch (error) {
      console.error('Error adding list item:', error);
    }
  };

  const handleDeleteList = async (listId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/lists/${listId}`, {
        method: 'DELETE',
      });
      setLists(prevLists => prevLists.filter(list => list._id !== listId));
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const handleTickClick = async (listId, itemId) => {
    const updatedLists = lists.map(list => {
      if (list._id === listId) {
        const updatedItems = list.items.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              showTick: !item.showTick,
            };
          }
          return item;
        });
        return {
          ...list,
          items: updatedItems,
        };
      }
      return list;
    });

    setLists(updatedLists);

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/lists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLists.find(list => list._id === listId)),
      });
    } catch (error) {
      console.error('Error updating list item:', error);
    }
  };

  const handleDragStart = (listId, itemId, e) => {
    e.dataTransfer.setData('listId', listId);
    e.dataTransfer.setData('itemId', itemId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (targetListId, e) => {
    const sourceListId = e.dataTransfer.getData('listId');
    const itemId = e.dataTransfer.getData('itemId');

    const movedItem = lists.find(list => list._id === sourceListId).items.find(item => item.id === itemId);

    const updatedLists = lists.map(list => {
      if (list._id === sourceListId) {
        return {
          ...list,
          items: list.items.filter(item => item.id !== itemId),
        };
      }
      if (list._id === targetListId) {
        return {
          ...list,
          items: [...list.items, movedItem],
        };
      }
      return list;
    });

    setLists(updatedLists);

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/lists/${sourceListId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLists.find(list => list._id === sourceListId)),
      });

      await fetch(`${process.env.REACT_APP_API_URL}/api/lists/${targetListId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLists.find(list => list._id === targetListId)),
      });
    } catch (error) {
      console.error('Error updating list after item move:', error);
    }
  };

  return (
    <div className='container'>
      <div className='buttoncontainer'>
        <header>Create new list</header>
        <button onClick={handleAddList}>+</button>
      </div>
      {lists.map((list, index) => (
        <div
          className='list'
          key={list._id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(list._id, e)}
        >
          <header>List: {index + 1}</header>

          {list.items.map(item => (
            <div
              className='listItem'
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(list._id, item.id, e)}
            >
              <div className='tick' onClick={() => handleTickClick(list._id, item.id)}>
                {item.showTick && <TiTick />}
              </div>
              <p>{item.content}</p>
            </div>
          ))}
          <div className='add_delete'>
            <button onClick={() => handleAddListItem(list._id)}><GrAdd /></button>
            <button onClick={() => handleDeleteList(list._id)}><MdDeleteOutline /></button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
